/**
 * Levenshtein Distance Algorithm
 *
 * Calculates the minimum number of single-character edits (insertions, deletions, or substitutions)
 * needed to transform one string into another.
 *
 * Used for fuzzy string matching in write_input practice mode to allow lenient answer checking.
 *
 * Time Complexity: O(m * n) where m and n are string lengths
 * Space Complexity: O(m * n) for the DP table
 *
 * @see https://en.wikipedia.org/wiki/Levenshtein_distance
 */

/**
 * Calculate Levenshtein distance between two strings
 *
 * @param str1 - First string to compare
 * @param str2 - Second string to compare
 * @returns The minimum number of edits needed to transform str1 into str2
 *
 * @example
 * levenshteinDistance('kitten', 'sitting') // Returns 3
 * levenshteinDistance('Καλημέρα', 'Καλημερα') // Returns 1 (missing accent)
 * levenshteinDistance('hello', 'hello') // Returns 0 (identical)
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  // Edge cases
  if (m === 0) return n;
  if (n === 0) return m;

  // Create 2D DP table
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i; // Cost of deleting all characters from str1
  }

  for (let j = 0; j <= n; j++) {
    dp[0][j] = j; // Cost of inserting all characters from str2
  }

  // Fill the DP table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        // Characters match - no edit needed
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        // Characters differ - choose minimum cost operation
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // Deletion
          dp[i][j - 1] + 1,     // Insertion
          dp[i - 1][j - 1] + 1  // Substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculate similarity percentage between two strings based on Levenshtein distance
 *
 * @param str1 - First string to compare
 * @param str2 - Second string to compare
 * @returns Similarity percentage (0-100), where 100 is identical
 *
 * @example
 * levenshteinSimilarity('hello', 'hello') // Returns 100
 * levenshteinSimilarity('hello', 'hallo') // Returns 80
 * levenshteinSimilarity('abc', 'xyz') // Returns 0
 */
export function levenshteinSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 100; // Both empty strings

  const distance = levenshteinDistance(str1, str2);
  const similarity = ((maxLength - distance) / maxLength) * 100;

  return Math.max(0, Math.min(100, Math.round(similarity)));
}

/**
 * Check if two strings are "close enough" based on a tolerance threshold
 *
 * @param str1 - First string to compare
 * @param str2 - Second string to compare
 * @param tolerancePercent - Allowed distance as percentage of string length (default: 15%)
 * @returns True if strings are within tolerance, false otherwise
 *
 * @example
 * // With 15% tolerance on 10-character string = 1.5 characters difference allowed
 * isCloseMatch('Καλημέρα', 'Καλημερα') // Returns true (1 char difference)
 * isCloseMatch('hello', 'hallo') // Returns true (1 char difference in 5-char string)
 * isCloseMatch('hello', 'world') // Returns false (4 char difference)
 */
export function isCloseMatch(
  str1: string,
  str2: string,
  tolerancePercent: number = 15
): boolean {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return true; // Both empty

  const distance = levenshteinDistance(str1, str2);
  const allowedDistance = Math.ceil((maxLength * tolerancePercent) / 100);

  return distance <= allowedDistance;
}

/**
 * Normalize Greek text for comparison
 * - Convert to lowercase
 * - Remove diacritics/accents (optional - may want to keep for Greek learning)
 * - Trim whitespace
 *
 * @param text - Greek text to normalize
 * @param removeDiacritics - Whether to remove Greek accent marks (default: false)
 * @returns Normalized text
 *
 * @example
 * normalizeGreekText('  Καλημέρα  ') // Returns 'καλημέρα'
 * normalizeGreekText('Καλημέρα', true) // Returns 'καλημερα' (no accent)
 */
export function normalizeGreekText(text: string, removeDiacritics: boolean = false): string {
  let normalized = text.trim().toLowerCase();

  if (removeDiacritics) {
    // Remove common Greek diacritics
    // Note: For Greek learning, we may want to keep these!
    // Only use this for very lenient matching
    normalized = normalized
      .replace(/[άἀἁἂἃἄἅἆἇὰάᾀᾁᾂᾃᾄᾅᾆᾇᾰᾱᾲᾳᾴᾶᾷ]/g, 'α')
      .replace(/[έἐἑἒἓἔἕὲέ]/g, 'ε')
      .replace(/[ήἠἡἢἣἤἥἦἧὴήᾐᾑᾒᾓᾔᾕᾖᾗῆῃῄῇ]/g, 'η')
      .replace(/[ίἰἱἲἳἴἵἶἷὶίῐῑῒΐῖῗ]/g, 'ι')
      .replace(/[όὀὁὂὃὄὅὸό]/g, 'ο')
      .replace(/[ύὐὑὒὓὔὕὖὗὺύῠῡῢΰῦῧ]/g, 'υ')
      .replace(/[ώὠὡὢὣὤὥὦὧὼώᾠᾡᾢᾣᾤᾥᾦᾧῶῳῴῷ]/g, 'ω');
  }

  return normalized;
}

/**
 * Compare Greek answers with intelligent matching
 * - Handles case-insensitive comparison
 * - Optional diacritic tolerance
 * - Whitespace normalization
 *
 * @param userAnswer - Answer provided by user
 * @param correctAnswer - Correct answer to compare against
 * @param strictMode - If true, require exact match (including diacritics)
 * @returns Object with match result and similarity details
 *
 * @example
 * compareGreekAnswers('Καλημέρα', 'καλημέρα', true) // exact: true
 * compareGreekAnswers('Καλημερα', 'Καλημέρα', false) // close: true
 * compareGreekAnswers('hello', 'world', false) // exact: false, close: false
 */
export function compareGreekAnswers(
  userAnswer: string,
  correctAnswer: string,
  strictMode: boolean = false
): {
  exact: boolean;
  close: boolean;
  similarity: number;
  distance: number;
} {
  // Normalize both answers
  const normalizedUser = normalizeGreekText(userAnswer, !strictMode);
  const normalizedCorrect = normalizeGreekText(correctAnswer, !strictMode);

  // Check exact match
  const exact = normalizedUser === normalizedCorrect;

  // Calculate distance and similarity
  const distance = levenshteinDistance(normalizedUser, normalizedCorrect);
  const similarity = levenshteinSimilarity(normalizedUser, normalizedCorrect);

  // Check if close match (within 15% tolerance)
  const close = isCloseMatch(normalizedUser, normalizedCorrect, 15);

  return {
    exact,
    close,
    similarity,
    distance
  };
}
