module.exports = class CustomField {
    constructor(value, value_id) {
        this.value = value;
        this.value_id = value_id;
    }

    toApiPayload() {
        if (this.value_id) {
            return { id: this.value_id.toString() };
        }

        return { value: this.value };
    }
};
