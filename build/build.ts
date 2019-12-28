#!/usr/bin/env node_modules/.bin/ts-node

import { query } from 'jsonpath';
import { parseStringPromise } from 'xml2js';
import { readFile, writeFile, PathLike } from 'fs';
import { promisify } from 'util';
import commander from 'commander';
import { Handlebars } from './handlebars';

const readFilePromise = promisify(readFile);
const writeFilePromise = promisify(writeFile);

const DEFAULT_ENCODING = 'utf-8';
const DEFAULT_XML_PATH = './downloaded/current.xml';
const DEFAULT_TEMPLATE_PATH = './build/template/index.ts.template';
const DEFAULT_OUT_PATH = './src/index.ts';
const DEFAULT_ABORT_ON_ERROR = false;

const getCommand = (): commander.Command => {
    return commander
        .description('Data dictionary builder for DICOM PS3.6 Part 06 spcifications')
        .arguments('<xml_path>')
        .option('--encoding <encoding>', 'Text encoding for parsing the XML file', DEFAULT_ENCODING)
        .option(
            '-f, --ignore-errors',
            'Continue if errors are thrown in XML parsing',
            DEFAULT_ABORT_ON_ERROR
        )
        .option(
            '-o, --out-path <outPath>',
            'Output path of the generated .ts module',
            DEFAULT_OUT_PATH
        )
        .option(
            '-t, --template-path <templatePath>',
            'Path to the Handlebars template used to generate the .ts module',
            DEFAULT_TEMPLATE_PATH
        );
};

const loadXmlAsJson = async (path: PathLike, encoding: string): Promise<ParsedXml> => {
    return readFilePromise(path, { encoding }).then((rawFile) => parseStringPromise(rawFile));
};

const parseRowsFromJson = (parsedXml: ParsedXml, ignoreErrors: boolean): any[] => {
    console.debug(`Parsed title: ${parsedXml.book.subtitle}`);

    // Data dictionary is in chapter 6
    const dictionaryChapter = parsedXml.book.chapter.find(
        (chapter) => chapter.$['xml:id'] === 'chapter_6'
    );

    if (!dictionaryChapter) {
        throw new Error('Unable to find dictionary chapter');
    }

    const rows: any[] = dictionaryChapter.table[0].tbody[0].tr;

    return rows
        .map((row, rowNumber) => {
            try {
                const columns = row.td as any[];
                const values: (string | undefined)[] = columns.map((td) => {
                    if (td.para) {
                        // Old-style structure without 'emphasis' wrapper
                        if (typeof td.para[0] === 'string') return td.para[0];
                        // With 'emphasis' wrapper
                        else return query(td.para, '$.._')[0] || undefined;
                    }

                    return undefined;
                });

                if (!values[0]) {
                    throw new Error(
                        `Expected a value to be parsed for the elements but got ${values[0]}`
                    );
                }

                if (values.length === 5) {
                    // Older revisions of the XML document omit the 'note' column entirely when no note is present
                    values.push(undefined);
                    return values;
                } else if (values.length === 6) {
                    return values;
                } else {
                    throw new Error(
                        `Expected 5-6 values in row but got ${values.length}. Values are ${values}`
                    );
                }
            } catch (error) {
                console.warn(`Could not parse row ${rowNumber} due to an error: ${error.message}`);
                console.warn('Raw JSON dump of the row is as follows:');
                console.warn(JSON.stringify(row.td, null, 2));

                if (ignoreErrors) {
                    console.warn(error);
                    return null;
                } else {
                    throw error;
                }
            }
        })
        .filter(Boolean);
};

const buildTemplateData = (rows: (string | undefined)[][], ignoreErrors: boolean): TemplateData => {
    const keywords = new Map<string, string>();
    const elements: { [key: string]: any }[] = [];

    rows.forEach(([tag, name, keyword, vr, vm, note], rowNumber) => {
        try {
            if (!tag || !/^\([0-9ABCDEFFx]{4},[0-9ABCDEFx]{4}\)$/.test(tag))
                throw new Error(`Tag ${tag} is invalid`);
            if (!keyword) {
                console.debug(`Keyword ${keyword} is falsy, skipping...`);
                return;
            }

            // Generate keyword-to-tag mapping
            // dictionary uses non-utf8 whitespace characters - strip all of them
            keyword = keyword.replace(/[^\x00-\x7F\s]/g, '');
            if (keywords.has(keyword)) throw new Error(`Keyword ${keyword} already exists`);
            keywords.set(keyword, tag);

            // Generate element mapping
            elements.push({
                tag,
                name,
                keyword,
                vr,
                vm,
                note,
                isRetired: note ? /RET/.test(note) : false,
            });
        } catch (error) {
            console.warn(`Could not parse row ${rowNumber} due to an error: ${error.message}`);
            console.warn('Raw JSON dump of the row is as follows:');
            console.warn(JSON.stringify(rows[rowNumber], null, 2));

            if (ignoreErrors) {
                console.warn(error);
            } else {
                throw error;
            }
        }
    });

    const tags = Array.from(keywords.entries()).sort(([keywordA], [keywordB]) =>
        keywordA.localeCompare(keywordB)
    );

    return {
        tags,
        elements,
    };
};

const generateSourceFromTemplate = async (
    templatePath: PathLike,
    outPath: PathLike,
    data: TemplateData
): Promise<void> => {
    const rawTemplate = await readFilePromise(templatePath, { encoding: DEFAULT_ENCODING });

    const template = Handlebars.compile(rawTemplate);

    const outSource = template(data);

    await writeFilePromise(outPath, outSource, { encoding: DEFAULT_ENCODING });
};

const main = async (command: commander.Command): Promise<void> => {
    const [xmlPath] = command.args || [DEFAULT_XML_PATH];
    const { defaultEncoding, outPath, templatePath, ignoreErrors } = command;

    console.log(`Loading XML from ${xmlPath}...`);
    const parsedXml = await loadXmlAsJson(xmlPath, defaultEncoding);
    const rows = parseRowsFromJson(parsedXml, ignoreErrors);
    const templateData = buildTemplateData(rows, ignoreErrors);

    console.log(`Generating source at ${outPath}...`);
    await generateSourceFromTemplate(templatePath, outPath, templateData);
    console.log('Done.');
};

const handleError = (error: Error): void => {
    console.error(error);
    process.exit(1);
};

// Entry point
const command = getCommand().parse(process.argv);
main(command).catch(handleError);

interface TemplateData {
    /**
     * Mapping of DICOM keyword to tag, eg. ["SpecificCharacterSet", "(0008,0005)"]
     */
    tags: [string, string][];
    elements: { [key: string]: any }[];
}

/**
 * Type alias for the output from xml2js.
 */
type ParsedXml = any;
