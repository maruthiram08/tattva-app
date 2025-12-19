# Tattva App - Backlog & Tech Debt

> **Last Updated**: December 19, 2025

---

## 🚀 Upcoming: Phase B - Automated Evaluators

| Task | Priority | Status |
|------|----------|--------|
| Citation Verifier | High | 🔲 Not Started |
| Routing Evaluator | High | 🔲 Not Started |
| Template Compliance Evaluator | High | 🔲 Not Started |

---

## 📋 Backlog: Phase B+ - Citation Quality

> **Priority**: After Phase B  
> **Impact**: Would improve Gemini quality score from 59.6% → ~75%+

| Task | Description | Difficulty |
|------|-------------|------------|
| Improve Retrieval Ranking | Better match shlokas to obscure topics | Medium |
| Handle "Not Found" Gracefully | Better UX when text doesn't contain answer | Low |
| Adjust Evaluation Criteria | "Honest refusal" as partial credit | Low |

---

## 🔧 Tech Debt

| Item | Area | Priority | Notes |
|------|------|----------|-------|
| Deprecated `google.generativeai` | Scripts | Medium | Migrate to `google.genai` |
| Python 3.9 EOL warnings | Scripts | Low | Upgrade to Python 3.10+ |
| Rate limiting in batch scripts | Evaluation | Low | Currently 4s hardcoded |
| Trace logging completeness | API | Medium | T2/T3 traces missing some fields |

---

## ✅ Recently Completed

### Phase A: OpenAI Citation Fix (Dec 19, 2025)
- [x] OpenAI citation generation (28.8% → 94.2%)
- [x] T3 refusal evaluation (0% → 100%)
- [x] API full_response capture
- [x] Documentation complete

---

## 📝 Ideas / Nice-to-Have

| Idea | Notes |
|------|-------|
| Multi-version Ramayana support | Critical Edition vs Vulgate |
| Streaming citation display | Show citations as they generate |
| Citation hover preview | Show shloka text on hover |
| Answer confidence indicator | Visual indicator of certainty |

---

## 🐛 Known Issues

| Issue | Severity | Status |
|-------|----------|--------|
| ~20 questions have citations but low quality | Low | Known - Phase B+ |
| Some T1 answers too brief | Low | Backlog |

---

## Notes

- **Phase A**: ✅ Complete
- **Phase B**: 🔲 Next up - Automated evaluators
- **Phase B+**: 📋 Future - Quality improvements
