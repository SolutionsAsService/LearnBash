# Contributing to LearnBash

Thanks for taking a look. Contributions of every size are welcome: bug reports, typo fixes,
docs, new features, data corrections and ideas.

## Ways to help

- **Report a bug or a wrong fact.** Open an issue with what you did, what you expected and what
  happened instead. Screenshots, logs or a source link help a lot.
- **Suggest an idea.** Open an issue describing the problem it solves before writing a lot of code,
  so we can agree on the approach first.
- **Send a fix.** Small, focused pull requests are reviewed fastest.

## Getting set up

The pages are generated from data, so edit the data and rebuild; do not edit the `.html` files by hand. You need Python 3, Bash with GNU tools, and Node for the explainer check.

```bash
git clone https://github.com/SolutionsAsService/LearnBash
cd LearnBash
python3 scripts/run_examples.py     # re-run every example and record its real output
python3 scripts/build.py            # regenerate the pages
python3 scripts/build.py --check && python3 scripts/run_examples.py --check && node scripts/check-explain.js
npx serve .                         # then open the printed localhost URL
```

Commands, flags and their marks are in `data/commands.json`; lessons and their code blocks are in `data/lessons.json`. Every code block marked to run is executed for real, so an example that fails or prints something different shows up in the output. Keep links relative so the site still deploys from any host.

## Making a change

1. Fork the repo and create a branch from the default branch: `git checkout -b fix/short-description`.
2. Keep the change focused on one thing, and match the style of the surrounding code.
3. Test what you changed (run it, run the tests if there are any) and note how you checked it.
4. Write a clear commit message in the imperative: `Fix crash when config is missing`.
5. Open a pull request that says what changed and why, and link the issue it closes.

## Pull request checklist

- [ ] The change does one thing and the description explains it.
- [ ] It runs locally, and existing tests still pass.
- [ ] Docs or README are updated if behaviour changed.
- [ ] No secrets, API keys or personal data are committed.

## Conduct

Be kind and constructive. Critique code, not people. Harassment of any kind is not tolerated.

## License

By contributing, you agree that your contributions are licensed under the MIT License of this
repository (see [LICENSE](LICENSE)).
