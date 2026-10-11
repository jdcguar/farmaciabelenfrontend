export function enfocarError(formulario: HTMLFormElement | null) {
  window.requestAnimationFrame(() => {
    const campo = formulario?.querySelector<HTMLElement>('[aria-invalid="true"]:not(select):not(:disabled)')
    campo?.focus()
    campo?.scrollIntoView({ block: 'center' })
  })
}
