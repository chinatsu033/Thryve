import { Card, Page } from '../components/ui'

function TelLink({
  href,
  label,
  hint,
  urgent,
}: {
  href: string
  label: string
  hint: string
  urgent?: boolean
}) {
  return (
    <a
      href={href}
      className={`crisis-tel ${urgent ? 'crisis-tel-urgent' : 'crisis-tel-calm'}`}
    >
      <span className="crisis-tel-label">{label}</span>
      <span className="crisis-tel-hint">{hint}</span>
    </a>
  )
}

export function CrisisHelpPage() {
  return (
    <Page title="紧急求助" sub="中国大陆 · 心理援助与急救指引">
      <Card className="crisis-urgent-card">
        <h3 className="card-title" style={{ color: 'var(--color-danger)' }}>
          立即危险时请先急救
        </h3>
        <p className="crisis-lead">
          若已自伤受伤、意识异常、持有危险物品，或生命安全受到威胁：请优先拨打医疗救护，需要警方现场救助时同时报警。心理热线不能替代急救调度。
        </p>
        <div className="crisis-tel-stack">
          <TelLink
            href="tel:120"
            label="拨打 120"
            hint="医疗救护（优先）"
            urgent
          />
          <TelLink
            href="tel:110"
            label="拨打 110"
            hint="需要警方现场救助时"
            urgent
          />
        </div>
      </Card>

      <Card title="心理援助热线">
        <p className="crisis-lead">
          需要倾听、疏导或危机干预时，可拨打全国统一心理援助热线（国家卫健委协调工信部设置；2025 年 5 月 1 日起全国 31 省区市开通；俗称「没事儿」热线）。
        </p>
        <div className="crisis-tel-stack">
          <TelLink
            href="tel:12356"
            label="拨打 12356"
            hint="全国统一心理援助热线"
          />
        </div>
        <ul className="crisis-notes">
          <li>各地服务时段可能不同（部分 24 小时），以当地接通为准。</li>
          <li>省内一般可直拨；部分地区可加拨区号接入指定城市坐席。</li>
          <li>热线可与 110 / 120 联动，但若你本人正处立即危险，仍应直接拨打 120 / 110。</li>
        </ul>
      </Card>

      <Card title="此刻可做的事">
        <ul className="crisis-tips">
          <li>尽量离开危险环境，把手边危险物品放到安全处。</li>
          <li>找一位可信任的人陪同，或请对方帮你拨打电话。</li>
          <li>做几次缓慢深呼吸：吸气 4 秒，呼气 6 秒。</li>
          <li>若暂时无法开口，也可先拨通热线，听对方引导。</li>
        </ul>
      </Card>

      <div className="disclaimer crisis-disclaimer" role="note">
        <p style={{ margin: 0 }}>
          Thryve / 本页<strong>不是</strong>急救或医疗诊断服务，不能替代专业医疗与现场救助。所列号码以官方为准；如有变更，以当地卫健委或运营商公告为准。
        </p>
        <p style={{ margin: '10px 0 0' }}>
          <a
            href="https://www.gov.cn/zhengce/zhengceku/202412/content_6994470.htm"
            target="_blank"
            rel="noopener noreferrer"
          >
            中国政府网相关通知
          </a>
        </p>
      </div>

    </Page>
  )
}
