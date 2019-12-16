#!/usr/bin/env node_modules/.bin/ts-node

import { query } from 'jsonpath';
import { parseStringPromise } from 'xml2js';
import { readFile, writeFile, PathLike } from 'fs';
import { promisify } from 'util';
import { Handlebars } from './handlebars';

const readFilePromise = promisify(readFile);
const writeFilePromise = promisify(writeFile);

// TODO parameterize
const defaultEncoding = 'utf-8';

// TODO receive this as an arg
const XML_PATH = './tmp/part06.xml';

// TODO parameterize these
const templatePath = './build/template/index.ts.template';
const outPath = './src/index.ts';

// TODO parameterize
const abortOnError = false;

const loadXmlAsJson = async (path: PathLike, encoding: string): Promise<any> => {
    return readFilePromise(path, { encoding }).then((rawFile) => parseStringPromise(rawFile));
};

const parseRowsFromJson = (parsedXml): any[] => {
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
                const r = row.td.map((td) => (td.para ? query(td.para, '$.._')[0] : undefined));

                if (r.length !== 6) {
                    throw new Error(`Expected 6 values in row but got ${r.length} values: ${r}`);
                }

                return r;
            } catch (error) {
                console.warn(`Could not parse row ${rowNumber} due to an error:`);
                console.warn(error);
                console.warn('Raw JSON dump of the row is as follows:');
                console.warn(JSON.stringify(row.td, null, 2));

                if (abortOnError) {
                    throw error;
                } else {
                    return null;
                }
            }
        })
        .filter(Boolean);
};

const buildTemplateData = (rows: (string | undefined)[][]): TemplateData => {
    const keywords = new Map<string, string>();
    const elements: { [key: string]: any }[] = [];

    rows.forEach(([tag, name, keyword, vr, vm, note]) => {
        try {
            if (!tag || !/^\([0-9ABCDEFFx]{4},[0-9ABCDEFx]{4}\)$/.test(tag))
                throw new Error(`Tag ${tag} is invalid`);
            if (!keyword) {
                console.warn(`Keyword ${keyword} is falsy, skipping...`);
                return;
            }

            // Generate keyword-to-tag mapping
            // dictionary uses non-utf8 whitespace characters - strip all of them
            keyword = keyword.replace(/[^\x00-\x7F\s]/g, '');
            if (keywords.has(keyword)) throw new Error(`Keyword ${keyword} already exists`);
            keywords.set(keyword, tag);

            // Generate element mapping
            elements.push({
                tag, name, keyword, vr, vm, note,
                isRetired: note ? /RET/.test(note) : false,
            });
        } catch (error) {
            console.warn(error);
            if (abortOnError) {
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

const generateSourceFromTemplate = async (templatePath: PathLike, outPath: PathLike, data: TemplateData): Promise<void> => {
    const rawTemplate = await readFilePromise(templatePath, { encoding: defaultEncoding });

    const template = Handlebars.compile(rawTemplate);

    const outSource = template(data);

    await writeFilePromise(outPath, outSource, { encoding: defaultEncoding });
};

const main = async (): Promise<void> => {
    console.log(`Loading XML from ${XML_PATH}...`);
    const parsedXml = await loadXmlAsJson(XML_PATH, defaultEncoding);
    const rows = parseRowsFromJson(parsedXml);
    const templateData = buildTemplateData(rows);

    console.log(`Generating source at ${outPath}...`);
    await generateSourceFromTemplate(templatePath, outPath, templateData);
    console.log('Done.');
};

const handleError = (error: Error): void => {
    console.error(error);
    process.exit(1);
};

main().catch(handleError);

interface TemplateData {
    /**
     * Mapping of DICOM keyword to tag, eg. ["SpecificCharacterSet", "(0008,0005)"]
     */
    tags: [string, string][];
    elements: { [key: string]: any }[];
}
