import type { FormEvent } from 'react'

export function validarCantidadesAlEnviar(e: FormEvent<HTMLFormElement>) {
  const invalida = Array.from(e.currentTarget.querySelectorAll<HTMLInputElement>('input[data-error-cantidad]')).find(input => input.dataset.errorCantidad)
  if (invalida) { e.preventDefault(); e.stopPropagation(); invalida.focus(); invalida.reportValidity() }
}
