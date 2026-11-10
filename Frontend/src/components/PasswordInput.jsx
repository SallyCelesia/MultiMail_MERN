import { useState } from "react";

export default function PasswordInput({ id, value, onChange, placeholder, required = false, minLength }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-input-wrapper">
      <input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
      />
      <button
        className="password-visibility"
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={`${visible ? "Hide" : "Show"} password text`}
        aria-pressed={visible}
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}
