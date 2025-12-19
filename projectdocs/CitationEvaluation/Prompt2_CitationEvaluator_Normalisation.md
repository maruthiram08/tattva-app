You will be normalizing Kanda (book/chapter) names from the Ramayana to their canonical forms. The system's database uses different naming conventions, and your task is to convert any variation of a Kanda name to its standardized canonical form.

Here is the normalization map that defines all valid input variations and their corresponding canonical forms:

<normalization_map>
{{NORMALIZATION_MAP}}
</normalization_map>

Here is the Kanda name input that needs to be normalized:

<kanda_input>
{{KANDA_INPUT}}
</kanda_input>

To normalize the Kanda name, follow these steps:

1. Convert the input to lowercase
2. Remove all spaces, hyphens, and other separating characters
3. Look up the processed input in the normalization map
4. Return the canonical form if a match is found
5. If no match is found in the normalization map, return the original input unchanged

Important rules:
- The normalization map is case-insensitive for lookups (always convert input to lowercase first)
- Spaces and hyphens should be removed before lookup (e.g., "bala kanda" becomes "balakanda")
- The canonical forms are: Bala, Ayodhya, Aranya, Kishkindha, Sundara, Yuddha, and Uttara
- If the input doesn't match any known variation, return it as-is without modification

Provide your response in the following format:
- First, show your processing steps inside <processing> tags
- Then, provide the final normalized Kanda name inside <normalized_kanda> tags

Example 1:
Input: "bala kanda"
<processing>
1. Convert to lowercase: "bala kanda"
2. Remove spaces: "balakanda"
3. Look up "balakanda" in map: found -> "Bala"
</processing>
<normalized_kanda>Bala</normalized_kanda>

Example 2:
Input: "5"
<processing>
1. Convert to lowercase: "5"
2. Remove spaces/hyphens: "5"
3. Look up "5" in map: found -> "Sundara"
</processing>
<normalized_kanda>Sundara</normalized_kanda>

Example 3:
Input: "UnknownKanda"
<processing>
1. Convert to lowercase: "unknownkanda"
2. Remove spaces/hyphens: "unknownkanda"
3. Look up "unknownkanda" in map: not found
4. Return original input unchanged
</processing>
<normalized_kanda>UnknownKanda</normalized_kanda>

Now, please normalize the provided Kanda input.