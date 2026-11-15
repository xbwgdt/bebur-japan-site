import {getCompanyPage, localCompanyOverview} from './company-overview';
import type {SanityPage} from './sanity/queries';
import type {HeroPageBlock} from './page-blocks';

export type CompanyInformationSlug = 'culture' | 'history';

export function companyInformationFallback(slug: CompanyInformationSlug): SanityPage {
  const culture=slug==='culture';
  const title=culture?'企業文化':'沿革';
  const summary=culture
    ?'信頼できる計測と技術サポートで、お客様と現場の未来を支える。'
    :'2002年の創業から、計測技術とグローバルなネットワークを育んできたBeburの歩み。';
  const page=structuredClone(localCompanyOverview);
  const section=page.blocks.find(block=>block.anchorId===(culture?'company-culture':'company-history'))!;
  // This is an independent detail page; do not link its own culture cards back
  // to the same page. Editors may add meaningful links later in Sanity.
  if(section._type==='cardGrid')for(const card of section.cards??[]){delete card.href;delete card.linkLabel;}
  const hero={...page.blocks[0],title,summary,ctaLabel:culture?'企業理念を見る':'Beburの歩みを見る',ctaHref:'#'+section.anchorId} as HeroPageBlock;
  return {...page,_id:'page--'+slug,slug,title,seoTitle:title+'｜Bebur Japan',seoDescription:culture
    ?'Beburのミッション、ビジョン、ブランド理念をご紹介します。信頼性の高い水質・ガス・清浄度測定機器と、専門的な技術サポートでお客様の現場を支えます。'
    :'Beburの2002年の創業から、アジア市場への展開、計測製品の開発、中国法人の設立、グローバル展開までの主な歩みをご紹介します。',
    companyOverviewStyle:{...page.companyOverviewStyle as Record<string,unknown>,eyebrow:culture?'OUR CULTURE':'OUR HISTORY'},
    blocks:[hero,section,page.blocks.find(block=>block.anchorId==='japan-contact')!]};
}

export async function getCompanyInformation(slug:CompanyInformationSlug){
  return getCompanyPage(slug,companyInformationFallback(slug));
}
