// Clickable 2D scenes. No avatar, canvas engine, route follower or movement listeners.
export const MEETINGS = {
 hotel: {image:'hotel-meeting-v1.webp',title:'A meeting at Sole Nascente',location:'Hotel meeting lounge',people:[['lucia',22],['marco',50],['elena',81]]},
 bakery: {image:'bakery-meeting-v1.webp',title:'At Marta’s bakery',location:'Bakery work table',people:[['marta',28],['paolo',74]]},
 winery: {image:'winery-meeting-v1.webp',title:'At the vineyard',location:'Winery tasting table',people:[['sofia',26],['giulia',74]]}
};
export function townScene(){
 return `<section class="town-stage town-overview" aria-label="Clickable 2D town overview"><img src="assets/italian-coast-map-v2.png" alt="Illustrated Italian lakeside town with the hotel on the left, a bakery below it and a vineyard on the right." width="1619" height="971" fetchpriority="high"><button class="building-hotspot hotel" data-visit="hotel" aria-label="Enter Hotel Sole Nascente"><span><small>MAIN CASE</small><strong>Hotel Sole Nascente</strong><em>Enter the hotel ↗</em></span></button><button class="building-hotspot bakery" data-visit="bakery" aria-label="Enter Marta’s bakery"><span><small>OPTIONAL EXTENSION</small><strong>Marta’s Bakery</strong><em>Visit the bakery ↗</em></span></button><button class="building-hotspot winery" data-visit="winery" aria-label="Enter Sole Vineyard"><span><small>OPTIONAL EXTENSION</small><strong>Sole Vineyard</strong><em>Visit the vineyard ↗</em></span></button></section>`;
}
export function meetingScene(id,staff,esc){
 const meeting=MEETINGS[id];
 return `<section class="town-stage meeting-art" aria-label="Seated first-person ${esc(meeting.location.toLowerCase())}"><img src="assets/${meeting.image}" alt="Your seated view across a meeting table, facing ${Object.values(staff).map(p=>esc(p.name)).join(', ')}. An open workbook lies in front of you." width="1672" height="941" fetchpriority="high">${meeting.people.map(([key,x])=>`<button class="person-hotspot" style="--person-x:${x}%" data-person="${key}" aria-label="Talk to ${esc(staff[key].name)}, ${esc(staff[key].role)}"><span><strong>${esc(staff[key].name)}</strong><small>${esc(staff[key].role.split(' · ')[0])}</small><em>Speak ↗</em></span></button>`).join('')}<button class="table-workbook" data-action="workspace" aria-label="Open workbook on the table"><span>YOUR WORKBOOK</span><strong>Open calculations ↗</strong></button></section>`;
}
export function restoreInterviewHistory(log,staff){
 const byName=new Map(Object.values(staff).flatMap(group=>Object.entries(group).map(([id,p])=>[p.name,id]))),history=new Map();
 for(const row of [...log].reverse()){
  if(row.kind!=='question'||!row.data?.answer)continue;
  const id=row.data.personId||byName.get(row.data.speaker);if(!id)continue;
  history.set(id,[...(history.get(id)||[]),{question:row.detail,answer:row.data.answer,source:row.data.source,reason:row.data.reason}].slice(-30));
 }
 return history;
}
