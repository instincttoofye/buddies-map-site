const SubmitButton = ({ disabled }) => {
    return (
      <button
        type="submit"
        form="location-form"
        className="submit-button"
        disabled={disabled}
      >
        SUBMIT
      </button>
    );
  };
  
  export default SubmitButton;