export function collectionHealth(results) {
  const successful=results.filter(r=>!r.error).length;
  const deferred=results.filter(r=>r.error==='RATE_LIMIT_COOLDOWN').length;
  const failed=results.length-successful-deferred;
  const status=successful===0?'failed':successful===results.length?'success':'partial';
  const label={success:'Colectare completă',partial:'Colectare parțială',failed:'Colectare eșuată'}[status];
  return {status,successful,failed,deferred,summary:`${label}: ${successful}/${results.length} surse reușite · ${failed} indisponibile · ${deferred} amânate după limitarea furnizorului.`};
}
