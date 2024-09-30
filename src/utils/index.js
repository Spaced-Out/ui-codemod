const { RENDER_ATTRS, RENDER_ATTRS_BY_TAG } = require("../constants/index");

// returns if an attribute's value is rendered on screen
const isAttributeRenderable = (tag, attribute) => {
    if(RENDER_ATTRS[attribute] === true || (
        RENDER_ATTRS_BY_TAG[tag] && RENDER_ATTRS_BY_TAG[tag][attribute] === true
    )) {
        return true;
    }
    else {
        return false;
    }
}

// returns small subtree representing a call to useTransition function
const createUseTransitionCall = (jscodeshift, label) => {
    return jscodeshift.callExpression(
        jscodeshift.identifier('useTransition'),
        [
            jscodeshift.literal(getTranslationLabel(label)),
            jscodeshift.literal(label)
        ]
    );
}

// returns translation label for an extracted label
const getTranslationLabel = (label) => {
    return label.trim().split(" ").map((label) => label.toUpperCase()).join("_");
}

module.exports = {
    isAttributeRenderable,
    createUseTransitionCall,
    getTranslationLabel
}