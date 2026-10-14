/** `*…*` arasını italik teal yazar: "Refunds *anyone can check.*" */
export function Em({ text }: { text: string }) {
  return (
    <>
      {text.split('*').map((part, i) =>
        i % 2 === 1 ? (
          <em key={i} className="text-teal">
            {part}
          </em>
        ) : (
          part
        ),
      )}
    </>
  );
}
