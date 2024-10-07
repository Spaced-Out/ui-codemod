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
    ariaLabel: true,
    actionText: true,
    body:true,
    text:true,
    time:true,
    confirmText:true,
    abortText:true,
    description:true,
    actionText:true,
    heading:true,
    errorText:true,
    rejectReason:true,
    helperText:true,
    secondaryInstruction:true
}

const USE_I18N_IMPORT_PATH = "src/hooks/useI18n";

module.exports = {
    RENDER_ATTRS,
    RENDER_ATTRS_BY_TAG,
    USE_I18N_IMPORT_PATH
}