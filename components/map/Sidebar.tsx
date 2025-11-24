export default function Sidebar() {
  return (
    <div style={{ 
      height: "100%", 
      padding: "2rem", 
      backgroundColor: "#f9f9f9", 
      borderRight: "1px solid #e0e0e0",
      overflowY: "auto" // Pour scroller si le contenu est long
    }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Département de la Mayenne</h1>
      <p>
        Bienvenue sur la carte interactive. Sélectionnez une zone ou naviguez
        pour découvrir les détails du département.
      </p>
      <br />
      <button style={{ padding: "10px 20px", cursor: "pointer" }}>
        Action exemple
      </button>
    </div>
  );
}