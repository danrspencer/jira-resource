module.exports = class CustomField {
  constructor(value) {
    this.value = value;
  }

  toApiPayload() {
    return this.value;
  }
};
