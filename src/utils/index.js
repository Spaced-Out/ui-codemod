const { RENDER_ATTRS, RENDER_ATTRS_BY_TAG } = require("../constants/index");

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

module.exports = {
    isAttributeRenderable
}