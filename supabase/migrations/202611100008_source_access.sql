begin;
update public.research_sources set status='Suspendat · HTTP 403',detail='Acces refuzat din GitHub; colectarea este suspendată, fără reîncercări orare.' where id='eu-startups';
update public.research_sources set url='https://news.google.com/rss/search?q=%28IPO+OR+%22intention+to+float%22+OR+%22plans+to+list%22%29+%28London+OR+UK+OR+Britain+OR+LSE%29+when%3A90d&hl=en-GB&gl=GB&ceid=GB%3Aen' where id='news-uk';
commit;
