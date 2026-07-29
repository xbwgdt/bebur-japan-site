import Link from "next/link";

export default function NotFound(): React.ReactElement {
  return (
    <section className="not-found section">
      <div className="site-container not-found__inner">
        <p className="not-found__code">404</p>
        <h1>ページが見つかりません</h1>
        <p>
          お探しのページは移動または削除された可能性があります。ホームまたは製品情報から目的の情報をお探しください。
        </p>
        <div className="not-found__actions">
          <Link className="button button--primary" href="/">
            ホームへ戻る
          </Link>
          <Link className="button button--secondary" href="/products">
            製品情報を見る
          </Link>
        </div>
      </div>
    </section>
  );
}
