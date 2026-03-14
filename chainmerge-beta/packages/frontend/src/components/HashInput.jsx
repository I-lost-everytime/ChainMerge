export default function HashInput({ hash, onChange, onSubmit, loading }) {
  const handleKey = (e) => {
    if (e.key === "Enter" && !loading) onSubmit();
  };

  return (
    <div className="hash-input-wrap">
      <span className="hash-prefix">TX//</span>
      <input
        className="hash-input"
        type="text"
        value={hash}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder="0xabc... or 5xERTy... (paste any chain tx hash)"
        spellCheck={false}
        autoComplete="off"
        disabled={loading}
      />
      {hash && (
        <button
          className="hash-clear"
          onClick={() => onChange("")}
          title="Clear"
        >
          ×
        </button>
      )}
    </div>
  );
}