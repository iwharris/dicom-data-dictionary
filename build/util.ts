export const getRegexMatches = (regex: RegExp, testString: string): string[] => {
    const result = regex.exec(testString) || [];
    result.shift(); // Remove first element
    return result;
};
