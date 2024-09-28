# This is a list of known issues to fix to make the codemod reliable and robust

1. The filter of attribute based on tag needs more work. The entry is constants is dummy for now. The config needs to be comprehensive to ensure that extraction is accurate.

2. When extracting values, trimming needs to considered carefully and implementation needs to be updated to reflect the same.

3. Current replacment expression is a filler, it needs to be replaced with a proper call to i18next wrapper utility.