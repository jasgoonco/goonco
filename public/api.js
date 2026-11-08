// Same-origin public-metadata API reader. Never send local health-draft values here.
export async function readAPI(path,fetcher=fetch){
 const response=await fetcher('/api/v1/'+path,{credentials:'same-origin',cache:'no-store'});
 if(!response.ok){
  const error=new Error(response.status===401?'Your review session is locked or expired. Unlock review to continue.':response.status===403?'This account is not permitted to open this resource.':'The workspace could not load this view ('+response.status+').');
  error.status=response.status;error.code=response.status===401?'REVIEW_LOCKED':'API_ERROR';throw error;
 }
 return response.json();
}

export async function sendResearchQuery(settings,fetcher=fetch){
 const response=await fetcher('/api/v1/research/query',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(settings)});
 if(!response.ok){const error=new Error(response.status===401?'Your review session is locked or expired. Unlock review to continue.':'The structured search could not be completed ('+response.status+').');error.status=response.status;error.code=response.status===401?'REVIEW_LOCKED':'QUERY_FAILED';throw error;}
 return response.json();
}
