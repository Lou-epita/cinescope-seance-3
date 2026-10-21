import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { Film } from "../films";
import { readReservation, type Errors, type Reservation } from "../reservation";

type BookingDialogProps = {
  film: Film;
  onConfirm: (film: Film, reservation: Reservation) => void;
  onClose: () => void;
};

const fieldLabels: Record<keyof Errors, string> = {
  tariff: "Type de place",
  name: "Nom de réservation",
  email: "Adresse électronique",
};
const fieldOrder = ["tariff", "name", "email"] as const;

export default function BookingDialog({ film, onConfirm, onClose }: BookingDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const tariffRef = useRef<HTMLFieldSetElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const confirmedRef = useRef(false);
  const prefix = useId();
  const id = (part: string) => `${prefix.replace(/[^A-Za-z0-9_-]/g, "")}-${part}`;
  const [errors, setErrors] = useState<Errors>({});
  const [attempt, setAttempt] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

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
    setShowSummary(Object.keys(result.errors).length > 0);
    setAttempt((value) => value + 1);
    if (Object.keys(result.errors).length > 0) return;
    confirmedRef.current = true;
    onConfirm(film, result.values);
    closeBooking();
  };

  const focusField = (field: keyof Errors) => {
    const target = field === "tariff"
      ? tariffRef.current?.querySelector<HTMLInputElement>("input")
      : field === "name" ? nameRef.current : emailRef.current;
    target?.focus();
  };
  const invalidFields = fieldOrder.filter((field) => errors[field]);

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
          {showSummary && invalidFields.length > 0 && (
            <div ref={summaryRef} tabIndex={-1} className="error-summary" role="group" aria-labelledby={id("summary-title")} aria-describedby={id("summary-help")}>
              <h3 id={id("summary-title")}>{invalidFields.length} erreur(s) empêch(ent) la réservation</h3>
            </div>
          )}
          <form noValidate onSubmit={submit}>
            {/* Type de place */}
            <fieldset ref={tariffRef} className="form-group" aria-describedby="tariff-help tarrif-error">
              <legend>Type de place (obligatoire)</legend>
              <div className="choices">
                <label>
                  <input type="radio" name="tariff-b" value="standard"/> Standard
                </label>
                <label>
                  <input type="radio" name="tariff-b" value="student"/> Étudiant
                </label>
              </div>
              {errors.tariff && <p id={id("tariff-error")} className="field-error">{errors.tariff}</p>}
            </fieldset>
            {/* Nom */}
            <div className="field">
              <p className="name-help" id={id("name-help")}>Indiquez le nom de la personne qui réserve.</p>
              <label htmlFor={id("name")}>Nom de réservation (obligatoire)</label>
              <input ref={nameRef} id={id("name")} name="name" placeholder="Votre nom" autoComplete="name" required
                className={errors.name ? "invalid" : undefined}
                aria-invalid={errors.name ? true : undefined}
                aria-describedby="name-help name-error" />
              {errors.name && <p id={id("name-error")} className="field-error">{errors.name}</p>}
            </div>
            {/* Mail */}
            <div className="field">
              <p className="field-help" id={id("email-help")}>Format attendu : nom@exemple.fr.</p>
              <label htmlFor={id("email")}>Adresse électronique (obligatoire)</label>
              <input id={id("email")} aria-describedby="email-help email-error" aria-invalid="true" name="email" type="email" placeholder="Votre adresse" autoComplete="email" required />
              <p className="field-error" id="email-error">Saisissez une adresse électronique au format nom@exemple.fr.</p>
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
