import { useEffect, useId, useRef, useState, type FormEvent, type MouseEvent } from "react";
import type { Film } from "../films";
import { readReservation, type Errors, type Reservation } from "../reservation";

type BookingDialogProps = {
  film: Film;
  onConfirm: (film: Film, reservation: Reservation) => void;
  onClose: () => void;
};

const fields: { key: keyof Errors; label: string }[] = [
  { key: "tariff", label: "Type de place" },
  { key: "name", label: "Nom de réservation" },
  { key: "email", label: "Adresse électronique" },
];

export default function BookingDialog({ film, onConfirm, onClose }: BookingDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const confirmedRef = useRef(false);
  const prefix = useId();
  const id = (part: string) => `${prefix}-${part}`;
  const [errors, setErrors] = useState<Errors>({});
  const errorsLeft = fields.filter((field) => errors[field.key]);
  const [attempt, setAttempt] = useState(0);
  const summaryRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    confirmedRef.current = false;
    if (!dialog.open) dialog.showModal();
    titleRef.current?.focus();
  }, [film.id]);

  useEffect(() => {
    if (attempt > 0 && Object.keys(errors).length > 0)
      summaryRef.current?.focus();
  }, [attempt]);

  const closeBooking = () => dialogRef.current?.close();
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!film.available || confirmedRef.current) return;
    const result = readReservation(event.currentTarget);
    setErrors(result.errors);
    setAttempt((value) => value + 1);
    if (Object.keys(result.errors).length > 0) return;
    confirmedRef.current = true;
    onConfirm(film, result.values);
    closeBooking();
  };

  const joinField = (event: MouseEvent<HTMLAnchorElement>, key: keyof Errors) => {
    event.preventDefault();
    const target = key === "tariff"
      ? formRef.current?.querySelector<HTMLInputElement>('input[name="tariff"]')
      : formRef.current?.elements.namedItem(key) as HTMLInputElement | null;
    target?.focus();
  };

  return (
    <dialog ref={dialogRef} aria-labelledby={id("title")} onClose={onClose}>
      <div className="dialog-heading">
        <h2 id={id("title")} ref={titleRef} tabIndex={-1}>Réserver {film.title}</h2>
        <button type="button" className="close" aria-label="Fermer la réservation" onClick={closeBooking}>×</button>
      </div>
      <p>{film.genre} · Séance de {film.time}</p>
      <p className={"availability " + (film.available ? "available" : "unavailable")}>
        {film.available ? "Places disponibles" : "Séance complète"}
      </p>

      {film.available ? (
        <>
          <p>Une place par réservation. Tous les champs du formulaire sont obligatoires.</p>
          <p className="demo-note">Démonstration : aucun billet réel ni envoi de courriel.</p>

          {errorsLeft.length > 0 && (
            <div role="region" ref={summaryRef} tabIndex={-1} className="error-summary" aria-labelledby={id("summary-title")} aria-describedby={id("summary-help")}>
              <h3 id={id("summary-title")}>{errorsLeft.length} erreur{errorsLeft.length > 1 ? "s empêchent" : " empêche"} la réservation</h3>
              <ul>
                {errorsLeft.map(({ key, label }) => (
                  <li key={key}>
                    <a id={id(`error-link-${key}`)} href={`#${id(key)}`} onClick={(event) => joinField(event, key)}>{errors[key]}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <form ref={formRef} noValidate onSubmit={submit}>
            {/* Type de place */}
            <fieldset id={id("tariff")} className="form-group" aria-describedby={errors.tariff ? `${id("tariff-help")} ${id("tariff-error")}` : id("tariff-help")}>
              <legend>Type de place (obligatoire)</legend>
              <p className="field-help" id={id("tariff-help")}>Choisissez un type de place pour ce billet.</p>
              <div className="radio-options">
                <label>
                  <input type="radio" name="tariff" value="standard" required aria-invalid={errors.tariff ? true : undefined} /> Standard
                </label>
                <label>
                  <input type="radio" name="tariff" value="student" required aria-invalid={errors.tariff ? true : undefined} /> Étudiant
                </label>
              </div>
              {errors.tariff && <p id={id("tariff-error")} className="field-error">{errors.tariff}</p>}
            </fieldset>

            {/* Nom */}
            <div className="field">
              <label htmlFor={id("name")}>Nom de réservation (obligatoire)</label>
              <p className="field-help" id={id("name-help")}>Indiquez le nom de la personne qui réserve.</p>
              <input id={id("name")} name="name" required className={errors.name ? "invalid" : undefined} aria-invalid={errors.name ? true : undefined} aria-describedby={errors.name ? `${id("name-help")} ${id("name-error")}` : id("name-help")} />
              {errors.name && <p id={id("name-error")} className="field-error">{errors.name}</p>}
            </div>

            {/* Mail */}
            <div className="field">
              <label htmlFor={id("email")}>Adresse électronique (obligatoire)</label>
              <p className="field-help" id={id("email-help")}>Format attendu : nom@exemple.fr.</p>
              <input id={id("email")} name="email" type="email" required className={errors.email ? "invalid" : undefined} aria-invalid={errors.email ? true : undefined} aria-describedby={errors.email ? `${id("email-help")} ${id("email-error")}` : id("email-help")} />
              {errors.email && <p id={id("email-error")} className="field-error">{errors.email}</p>}
            </div>

            {/* Confirmation */}
            <div className="dialog-actions">
              <button className="dialog-action" type="submit">Confirmer la réservation</button>
              <button className="dialog-action dialog-secondary" type="button" onClick={closeBooking}>Revenir aux films</button>
            </div>
          </form>
        </>
      ) : (
        <>
          <p>Cette séance est complète : aucune réservation ne peut être confirmée.</p>
          <button className="dialog-action" type="button" onClick={closeBooking}>Revenir aux films</button>
        </>
      )}
    </dialog>
  );
}