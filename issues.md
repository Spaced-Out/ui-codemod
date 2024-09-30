# This is a list of known issues to fix to make the codemod reliable and robust

1. The filter of attribute based on tag needs more work. The entry is constants is dummy for now. The config needs to be comprehensive to ensure that extraction is accurate.

2. Current replacment expression is a filler, it needs to be replaced with a proper call to i18next wrapper utility.

3. Translation label is correct, but for the same label with different casing, there will be just one entry in translation file, which is fine. Need to confirm this.