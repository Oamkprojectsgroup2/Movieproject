import "../styles/Login.css";

function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        {children}
        <div class="login-info">
            <h2>LOGIN</h2>
            <input type="text" placeholder="username"></input>
            <input type="text" placeholder="password"></input>
        </div>
              
        <button className="login">Login</button>
      </div>
    </div>
  );
}

export default Modal;