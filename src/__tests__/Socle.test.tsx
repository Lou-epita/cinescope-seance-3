import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import App from "../App";
afterEach(cleanup);
describe("Socle conservé de la séance 2", () => {
  it("ouvre une modale nommée et focalise son titre", () => {
    render(<App />); fireEvent.click(screen.getByRole("button", {name:"Réserver Après l’aube"}));
    expect(screen.getByRole("heading", {name:"Réserver Après l’aube"})).toHaveFocus();
  });
  it("ferme et revient au film choisi", () => {
    render(<App />); const opener=screen.getByRole("button", {name:"Réserver Orbite 9"}); fireEvent.click(opener);
    fireEvent.click(screen.getByRole("button", {name:"Revenir aux films"})); expect(opener).toHaveFocus();
  });
  it("signale le champ email invalide avec son aide et son erreur", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Réserver Après l’aube" }));
    await user.click(screen.getByRole("button", { name: "Confirmer la réservation" }));
    const email = screen.getByRole("textbox", { name: /adresse électronique/i });
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAccessibleDescription(/Format attendu.*Saisissez une adresse électronique/s);
  });
  it("donne le focus au résumé après un envoi invalide", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Réserver Après l’aube" }));
    await user.click(screen.getByRole("button", { name: "Confirmer la réservation" }));
    expect(screen.getByRole("region", { name: /3 erreurs empêchent la réservation/i })).toHaveFocus();
  });
});
