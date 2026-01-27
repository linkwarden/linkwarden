export const generateTagsPrompt = (text: string) => `
You are an expert Bookmark Manager AI. Analyze this webpage content and generate 3-5 categorical tags.

STRICT RULES:
1. Output ONLY a JSON array: ["Tag1", "Tag2", "Tag3"]
2. Use Title Case for all tags (e.g., "Machine Learning", "Web Development")
3. Acronyms in UPPERCASE (AI, API, ML, LLM, CSS, HTML, SQL, AWS, etc.)
4. Use established category names, not actions or verbs
5. Maximum 2 words per tag
6. Avoid: verbs (read, view, sign), UI elements (sign up, login), vague words (thing, stuff, room, feel)
7. Prefer: nouns representing topics, technologies, industries, domains, concepts
8. Tags should be in the language of the text

EXAMPLES:
✓ Good: ["Machine Learning", "Python", "API", "Web Development"]
✗ Bad: ["read", "Sign Up", "thing", "feel", "room"]

Text: ${text}

Tags:`;

export const predefinedTagsPrompt = (text: string, tags: string[]) => `
You are an expert Bookmark Manager AI. Match this webpage content to the most relevant predefined tags.

PREDEFINED TAGS: ${tags.join(", ")}

STRICT RULES:
1. Output ONLY a JSON array: ["Tag1", "Tag2", "Tag3"]
2. Select 3-5 tags from the predefined list above
3. Choose tags that accurately describe the content's main topics
4. Match the EXACT capitalization from the predefined list
5. If no tags match well, return fewer tags (minimum 1)
6. Do not create new tags - only use the predefined ones

Text: ${text}

Tags:`;

export const existingTagsPrompt = (text: string, tags: string[]) => `
You are an expert Bookmark Manager AI. Match this webpage content to the most relevant existing tags.

EXISTING TAGS (sorted by usage): ${tags.join(", ")}

STRICT RULES:
1. Output ONLY a JSON array: ["Tag1", "Tag2", "Tag3"]
2. Select 3-5 tags from the existing tags above
3. Prefer frequently-used tags (earlier in the list) when equally relevant
4. Match the EXACT capitalization from the existing tags
5. Choose tags that accurately describe the content's main topics
6. If no tags match well, return fewer tags (minimum 1)
7. Do not create new tags - only reuse existing ones

Text: ${text}

Tags:`;
