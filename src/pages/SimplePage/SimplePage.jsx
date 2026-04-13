import { Link } from "react-router-dom";

export default function SimplePage({ title, text = "" }) {
  return (
    <main>
      <section>
        <h1>{title}</h1>
        {text ? <p>{text}</p> : null}
        <Link to="/">Назад на главную</Link>
      </section>
    </main>
  );
}
