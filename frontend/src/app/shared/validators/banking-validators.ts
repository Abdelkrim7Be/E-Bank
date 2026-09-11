import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export class BankingValidators {
  static accountNumber(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Don't validate empty values, use required validator for that
      }

      const accountNumberPattern = /^ACCT-[A-Z0-9]{8}$/;
      if (!accountNumberPattern.test(control.value)) {
        return {
          accountNumber: {
            message: "Account number must be in format ACCT-XXXXXXXX",
          },
        };
      }

      return null;
    };
  }

  static amount(min: number = 0.01, max: number = 1000000): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const amount = parseFloat(control.value);

      if (isNaN(amount)) {
        return { amount: { message: "Amount must be a valid number" } };
      }

      if (amount < min) {
        return { amount: { message: `Amount must be at least $${min}` } };
      }

      if (amount > max) {
        return {
          amount: { message: `Amount cannot exceed $${max.toLocaleString()}` },
        };
      }

      if (!/^\d+(\.\d{1,2})?$/.test(control.value.toString())) {
        return {
          amount: { message: "Amount can have at most 2 decimal places" },
        };
      }

      return null;
    };
  }

  static phoneNumber(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const phonePattern = /^(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}$/;

      if (!phonePattern.test(control.value)) {
        return {
          phoneNumber: {
            message: "Please enter a valid phone number",
          },
        };
      }

      return null;
    };
  }

  static strongPassword(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const password = control.value;
      const errors: any = {};

      if (password.length < 8) {
        errors.minLength = "Password must be at least 8 characters long";
      }

      if (!/[a-z]/.test(password)) {
        errors.lowercase =
          "Password must contain at least one lowercase letter";
      }

      if (!/[A-Z]/.test(password)) {
        errors.uppercase =
          "Password must contain at least one uppercase letter";
      }

      if (!/\d/.test(password)) {
        errors.digit = "Password must contain at least one number";
      }

      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.special = "Password must contain at least one special character";
      }

      return Object.keys(errors).length > 0 ? { strongPassword: errors } : null;
    };
  }

  static username(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const username = control.value;

      if (username.length < 3 || username.length > 20) {
        return {
          username: {
            message: "Username must be between 3 and 20 characters",
          },
        };
      }

      if (!/^[a-zA-Z][a-zA-Z0-9._-]*$/.test(username)) {
        return {
          username: {
            message:
              "Username can only contain letters, numbers, dots, dashes, and underscores, and must start with a letter",
          },
        };
      }

      if (/^\d/.test(username)) {
        return {
          username: {
            message: "Username cannot start with a number",
          },
        };
      }

      return null;
    };
  }

  static nationalId(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const ssnPattern = /^\d{3}-\d{2}-\d{4}$/;

      if (!ssnPattern.test(control.value)) {
        return {
          nationalId: {
            message: "National ID must be in format XXX-XX-XXXX",
          },
        };
      }

      return null;
    };
  }

  static dateOfBirth(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const birthDate = new Date(control.value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
      }

      if (age < 18) {
        return {
          dateOfBirth: {
            message: "You must be at least 18 years old",
          },
        };
      }

      if (age > 120) {
        return {
          dateOfBirth: {
            message: "Please enter a valid date of birth",
          },
        };
      }

      return null;
    };
  }

  static passwordMatch(passwordField: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const password = control.parent?.get(passwordField)?.value;
      const confirmPassword = control.value;

      if (password !== confirmPassword) {
        return {
          passwordMatch: {
            message: "Passwords do not match",
          },
        };
      }

      return null;
    };
  }

  static transactionDescription(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const description = control.value.trim();

      if (description.length < 3) {
        return {
          transactionDescription: {
            message: "Description must be at least 3 characters long",
          },
        };
      }

      if (description.length > 255) {
        return {
          transactionDescription: {
            message: "Description cannot exceed 255 characters",
          },
        };
      }

      if (/[<>\"'&]/.test(description)) {
        return {
          transactionDescription: {
            message: "Description contains invalid characters",
          },
        };
      }

      return null;
    };
  }
}
