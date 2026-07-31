export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const usernamePattern = /^[a-zA-Z0-9._-]{3,}$/;
export const mobilePattern = /^[+0-9 ()-]{8,}$/;
export const vehiclePattern = /^[A-Za-z0-9-]{4,}$/;

export const validators = {
  required: (label: string) => ({ required: `${label} is required` }),
  email: {
    required: "Email is required",
    pattern: { value: emailPattern, message: "Enter a valid email address" },
  },
  username: {
    required: "Username is required",
    pattern: { value: usernamePattern, message: "3+ characters, letters/numbers/._-" },
  },
  mobile: {
    required: "Mobile number is required",
    pattern: { value: mobilePattern, message: "Enter a valid mobile number" },
  },
  password: {
    required: "Password is required",
    minLength: { value: 8, message: "Minimum 8 characters" },
  },
  vehicleNumber: {
    required: "Vehicle number is required",
    pattern: { value: vehiclePattern, message: "Example: AAS-01-KA-9081" },
  },
};

export function passwordStrength(password: string): { score: number; label: string } {
  let score = 0;
  if (password.length >= 8) score += 25;
  if (/[A-Z]/.test(password)) score += 25;
  if (/[0-9]/.test(password)) score += 25;
  if (/[^A-Za-z0-9]/.test(password)) score += 25;
  const label = score >= 100 ? "Fortified" : score >= 75 ? "Strong" : score >= 50 ? "Moderate" : "Weak";
  return { score, label };
}
