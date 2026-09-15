import validator from "validator";

const USERNAME_REGEX = /^\w{3,32}$/;
const MODULE_REGEX = /^\w{3,64}$/;

export const isUsernameValid = (username: string) => USERNAME_REGEX.test(username);

export const isPasswordValid = (password: string) => password.length >= 8;

export const isEmailValid = (email: string) => validator.isEmail(email);

export const isModuleValid = (module: string) => MODULE_REGEX.test(module);
