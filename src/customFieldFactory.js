const FreeTextCustomField = require("./freeTextCustomField.js");
const SelectListCustomField = require("./selectListCustomField.js");

module.exports = () => {
    function buildCustomField(customField) {
        if (!customField.type) {
            return new FreeTextCustomField(customField.value);
        }

        switch (customField.type.toLowerCase()) {
            case "selectlist":
                return new SelectListCustomField(
                    customField.value,
                    customField.value_id
                );
            default:
                return new FreeTextCustomField(customField.value);
        }
    }

    return {
        buildCustomField
    };
};
