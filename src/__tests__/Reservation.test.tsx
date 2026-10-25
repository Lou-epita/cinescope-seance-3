import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import App from "../App";

afterEach(cleanup);

async function openBooking(user: ReturnType<typeof userEvent.setup>, film = "Après l’aube") {
  await user.click(screen.getByRole("button", { name: `Réserver ${film}` }));
  return screen.getByRole("dialog", { name: `Réserver ${film}` });
}

describe("Les erreurs du formulaire", () => {
  it("relie aide et erreur au champ invalide", async () => {
    const user = userEvent.setup();
    render(<App />);

    await openBooking(user);

    await user.click(
      screen.getByRole("button", {
        name: "Confirmer la réservation",
      })
    );

    const email = screen.getByRole("textbox", {
      name: /adresse électronique/i,
    });

    const descriptionIds = (
      email.getAttribute("aria-describedby") ?? ""
    )
      .split(/\s+/)
      .filter(Boolean);

    expect(descriptionIds).toHaveLength(2);

    const help = document.getElementById(descriptionIds[0]);
    const error = document.getElementById(descriptionIds[1]);

    expect(help).toHaveTextContent("Format attendu");
    expect(error).toHaveTextContent(
      "Saisissez une adresse électronique"
    );
  });

  it("nomme chaque champ et le groupe, puis marque les champs invalides", async () => {
    const user = userEvent.setup();
    render(<App />);

    const dialog = await openBooking(user);
    const group = within(dialog).getByRole("group", { name: "Type de place (obligatoire)" });

    await user.click(within(dialog).getByRole("button", { name: "Confirmer la réservation" }));

    const name = within(dialog).getByRole("textbox", { name: /nom de réservation/i });
    const email = within(dialog).getByRole("textbox", { name: /adresse électronique/i });
    const tariff = within(dialog).getByRole("radio", { name: "Standard" });

    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(tariff).toHaveAttribute("aria-invalid", "true");

    expect(group).toHaveAccessibleDescription(/choisissez un type de place/i);
  });

  it("focalise le résumé, rejoint le champ et conserve la saisie", async () => {
    const user = userEvent.setup();
    render(<App />);

    const dialog = await openBooking(user);
    const name = within(dialog).getByRole("textbox", { name: /nom de réservation/i });
    const email = within(dialog).getByRole("textbox", { name: /adresse électronique/i });

    await user.click(within(dialog).getByRole("radio", { name: "Standard" }));
    await user.type(name, "Camille Durand");
    await user.type(email, "camille@");
    await user.click(within(dialog).getByRole("button", { name: "Confirmer la réservation" }));

    const summary = within(dialog).getByRole("region", { name: /1 erreur empêche la réservation/i });
    expect(summary).toHaveFocus();

    await user.click(within(summary).getByRole("link", { name: /adresse électronique/i }));
    expect(email).toHaveFocus();
    expect(name).toHaveValue("Camille Durand");
    expect(email).toHaveValue("camille@");
  });
});
