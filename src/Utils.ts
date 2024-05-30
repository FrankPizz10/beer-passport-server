import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from 'obscenity';

const matcher = new RegExpMatcher({
	...englishDataset.build(),
	...englishRecommendedTransformers,
});

// Check Valid User Name
export const checkValidUserName = (text: string) => {
    // Check for spaces
    const noSpacesText = text.replace(/\s/g, "");
    if (noSpacesText.length < text.length) return false;
    // Check for profanity
    if (matcher.hasMatch(text)) return false;
}