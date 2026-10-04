import { useEffect } from "react";
import { createPortal } from "react-dom";
import "./styles/Modal.css";

function Modal({ isOpen, onClose, children }) {

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close modal">×</button>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export default Modal;
