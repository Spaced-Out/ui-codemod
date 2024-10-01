const RENDER_ATTRS_BY_TAG = {
    img: {
        alt: true
    },
    input: {
        value: true,
        placeholder: true
    },
    textarea: {
        value: true,
        placeholder: true
    }
}

const RENDER_ATTRS = {
    title: true,
    placeholder: true,
    label: true,
    'aria-label': true,
}

const USE_TRANSITION_IMPORT_PATH = "src/hooks/i18n";

module.exports = {
    RENDER_ATTRS,
    RENDER_ATTRS_BY_TAG,
    USE_TRANSITION_IMPORT_PATH
}