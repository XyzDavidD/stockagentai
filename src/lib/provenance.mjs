export function sourceCategory(kind){
 if(['Bursă','Registru oficial'].includes(kind))return 'Oficială · bursă / registru';
 if(kind==='Emitent')return 'Oficială · emitent';
 if(kind==='Comunicate distribuite')return 'Comunicat distribuit · de verificat';
 if(kind?.includes('Agregator'))return 'Neoficială · agregator';
 return 'Neoficială · presă';
}
export function isSpeculative(title){return /rumou?r|reportedly|could|may\b|consider|weigh|eyeing|zvon|ar putea|analizeaza|spekulat|erwagt|envisage/i.test(String(title).normalize('NFD').replace(/[\u0300-\u036f]/g,''));}
export function isPossibleSpac(title){return /\bSPAC\b|acquisition corp|acquisition company|blank.check/i.test(String(title).normalize('NFD').replace(/[\u0300-\u036f]/g,''));}
export function reportedEventDate(item){
 if(!item.source_name?.startsWith('Stock Analysis ·'))return null;
 const match=item.title.match(/ · ([A-Z][a-z]{2} \d{1,2}, \d{4})$/);
 const ts=match?Date.parse(match[1]+' 00:00:00 GMT'):NaN;
 return Number.isFinite(ts)?new Date(ts).toISOString():null;
}
