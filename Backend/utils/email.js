const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const senderPattern = /^(?:[^<>]+\s<[^<>\s]+@[^<>\s]+\.[^<>\s]+>|[^<>\s]+@[^<>\s]+\.[^<>\s]+)$/;

const isValidEmail = (value) => emailPattern.test(value);
const isValidSender = (value) => senderPattern.test(value.trim());

module.exports = { isValidEmail, isValidSender };
