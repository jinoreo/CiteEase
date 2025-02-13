export const convertAuthorsToGB = (authors) => {
    return authors.replace(/[、，]/g, ',');
};

export const convertAuthorsToLaw = (authors) => {
    return authors.replace(/[，,]/g, '、');
};

export const formatIssueNumber = (issue) => {
    return issue.padStart(2, '0');
}; 