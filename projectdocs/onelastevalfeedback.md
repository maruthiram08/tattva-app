
## 🟡 One Issue: Inconsistent Winner Values

Your `winner` column has 8 different values:

|Value|Count|Should Be|
|---|---|---|
|`CLAUDE`|9|✅ Keep|
|`TIE`|6|✅ Keep|
|`NO WINNER`|3|Standardize|
|`NO_WINNER`|2|Standardize|
|`DRAW`|2|Standardize|
|`NONE`|1|Standardize|
|`N/A`|1|Standardize|

**Fix**: Normalize to 4 values only:

- `OPENAI`
- `CLAUDE`
- `TIE`
- `NO_WINNER`

Quick fix in your parser:

```python
winner_map = {
    'NO WINNER': 'NO_WINNER',
    'DRAW': 'TIE',
    'NONE': 'NO_WINNER',
    'N/A': 'NO_WINNER'
}
winner = winner_map.get(winner, winner)
```
