# -*- coding: utf-8 -*-
"""Reports actual captured answers. An absent independent review is never converted into a pass."""
import json,sys,re,math,datetime,hashlib
from pathlib import Path
base=Path('tools/specialist-training/iteration-03');dest=Path('docs/specialist-training/iteration-03')
cases={c['id']:c for c in json.loads((base/'cases.json').read_text())}
reviews=json.loads((base/'math-review.json').read_text())
phase=sys.argv[1];records=[json.loads(l) for l in (base/(phase+'.jsonl')).read_text().splitlines() if l]
def review(r):
 specific=reviews.get(phase+'/'+r['id'])
 if specific:return specific
 if r['split']=='validation':return reviews.get(r['id'])
 if phase=='baseline-algebra-broad' and r['id']=='alg3-promoted-alg-val-surd':return reviews.get(r['id'])
 return None
def math_text(s):
 # Let a long inline list of coordinate pairs wrap between pairs while
 # preserving every captured expression and keeping each pair intact.
 return re.sub(r'\$\$([\s\S]*?)\$\$|\$([^$]*)\$',lambda m:'\\['+m[1]+'\\]' if m[1] is not None else '\\('+m[2].replace('), (',r'),\allowbreak (')+'\\)',s or '')
def tex_plain(s):
 escapes={'\\':r'\textbackslash{}','{':r'\{','}':r'\}','%':r'\%','&':r'\&','_':r'\_','#':r'\#','^':r'\textasciicircum{}','~':r'\textasciitilde{}'}
 s=''.join(escapes.get(c,c) for c in s)
 s=re.sub(r'∠([A-Z]{3})',lambda m:r'\(\widehat{'+m[1]+r'}\)',s)
 s=re.sub(r'△([A-Z]{3})',lambda m:r'\(\triangle '+m[1]+r'\)',s)
 symbols={'⊥':r'\perp','∥':r'\parallel','∽':r'\sim','·':r'\cdot','⇒':r'\Rightarrow','→':r'\to','↔':r'\leftrightarrow','≤':r'\le','≥':r'\ge','≠':r'\ne','∈':r'\in','∞':r'\infty','√':r'\surd','β':r'\beta','α':r'\alpha','γ':r'\gamma','²':r'{}^2','³':r'{}^3','⁴':r'{}^4','°':r'{}^\circ'}
 return ''.join(r'\('+symbols[c]+r'\)' if c in symbols else '-' if c=='−' else c for c in s)
def tex_text(s):
 parts=re.split(r'(\$\$[\s\S]*?\$\$|\$[^$]*\$)',s or '')
 return ''.join(math_text(p) if p.startswith('$') else tex_plain(p).replace('\n', '\\par\n') for p in parts)
def question_lines(s):
 # Split only plain-text subquestion labels; never change captured mathematics.
 parts=re.split(r'(\$\$[\s\S]*?\$\$|\$[^$]*\$)',s or '')
 return ''.join(p if p.startswith('$') else re.sub(r'(?<!\S)([a-d]\))\s+',r'\n\1 ',p) for p in parts).strip()
def latex_document(content):
 return '\\documentclass[a4paper]{article}\n\\usepackage[margin=18mm]{geometry}\n\\usepackage{fontspec}\n\\setmainfont{lmroman10-regular.otf}[BoldFont=lmroman10-bold.otf,ItalicFont=lmroman10-italic.otf,BoldItalicFont=lmroman10-bolditalic.otf]\n\\usepackage[vietnamese]{babel}\n\\usepackage{amsmath,amssymb}\n\\begin{document}\n'+content+'\n\\end{document}'
lat=sorted(r['durationMs'] for r in records);percentile=lambda p:lat[max(0,math.ceil(p*len(lat))-1)] if lat else None
scored=[review(r) for r in records if review(r) and review(r).get('rubric')]
correct_conclusions=sum(bool(review(r) and review(r).get('conclusionCorrect',review(r)['mathematics']=='pass')) for r in records)
passes=sum(bool(review(r) and review(r)['mathematics']=='pass' and review(r).get('completeness')!='fail') for r in records)
quality_passes=sum(bool(review(r) and review(r)['mathematics']=='pass' and review(r).get('completeness')!='fail' and review(r).get('explanation')!='fail' and not review(r).get('presentationPending') and r.get('renderAudit',{}).get('schemaValid') and not r.get('renderAudit',{}).get('latexErrors') and not r.get('renderAudit',{}).get('languageErrors')) for r in records)
summary={'phase':phase,'questionsExecuted':len(records),'ready':sum(r.get('body',{}).get('solution',{}).get('status')=='ready' for r in records),'independentlyReviewed':sum(review(r) is not None for r in records),'correctConclusionCount':correct_conclusions,'mathematicalPasses':passes,'qualityPasses':quality_passes,'diagnosticVariantCount':sum(cases.get(r['id'],{}).get('evaluationRole')=='diagnostic_family_variant' for r in records),'latencyMs':{'p50':percentile(.5),'p95':percentile(.95),'max':max(lat) if lat else None},'responsesOver30Seconds':sum(v>30000 for v in lat),'rubricScored':len(scored),'rubricMeanForReviewedOnly':sum(sum(s['rubric'].values()) for s in scored)/len(scored) if scored else None,'heldOut':any(r['split']=='held_out' for r in records),'humanSatisfaction':'Not measured'}
(base/(phase+'-summary.json')).write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
domain_names={'algebra':'Đại số','geometry':'Hình học','number_theory':'Số học','combinatorics':'Tổ hợp'}
domains={r.get('domain') for r in records}
title=domain_names.get(next(iter(domains)),'Đánh giá') if len(domains)==1 else 'Đánh giá tổng hợp'
lines=[f'# {title} — {phase}', '', f"Thực thi **{len(records)} câu hỏi**; **{summary['ready']}** phản hồi sẵn sàng. Có **{summary['independentlyReviewed']}** bài được kiểm tra toán học độc lập; **{passes}** bài có lập luận toán học đầy đủ; **{correct_conclusions}** bài có kết luận đúng (kết luận đúng riêng lẻ chưa đủ để đạt). {('Đây là tập held-out sau khi đóng băng cấu hình; không có kết luận hài lòng của người dùng.' if summary['heldOut'] else 'Không có kết quả held-out hoặc kết luận hài lòng của người dùng ở tập này.')}", '',f"Độ trễ xác nhận đề hiện tại + HTTP giải + lưu D1 + đọc toàn bộ JSON + kiểm tra schema/KaTeX/ngôn ngữ: p50 **{percentile(.5):.2f} ms**, p95 **{percentile(.95):.2f} ms**, lớn nhất **{max(lat):.2f} ms**; **{summary['responsesOver30Seconds']}** phản hồi quá 30 giây. OCR ảnh thật và thời gian vẽ trình duyệt được đo riêng, không gộp ngầm vào số này.", '', 'Rubric: đúng toán40, đầy đủ20, rõ cho lớp9 15, phương pháp10, LaTeX/hiển thị10, kiểm tra/nhận định giới hạn5. Chỉ chấm khi đã có kiểm tra bài thực tế; lỗi toán nghiêm trọng luôn loại khỏi cổng chất lượng. Điểm tự chấm là proxy, không thay thế đánh giá của người dùng.', '', 'Nguồn thô chứa toàn bộ câu trả lời, metadata và hash bản dựng: ['+phase+'.jsonl](../../../tools/specialist-training/iteration-03/'+phase+'.jsonl). '+('Cấu hình đã đóng băng trước khi thực thi held-out. ' if summary['heldOut'] else 'Tập phát triển/kiểm tra chẩn đoán. ')+'Mã LaTeX dùng XeLaTeX/Tectonic với font Unicode để giữ dấu tiếng Việt. TEX_COMPILATION_STATUS', '']
for index,r in enumerate(records,1):
 c=cases.get(r['id'],{});solution=r.get('body',{}).get('solution',{});lesson=solution.get('lesson');check=review(r);mathpass=check is not None and check['mathematics']=='pass';completepass=mathpass and check.get('completeness')!='fail';explainpass=mathpass and check.get('explanation')!='fail';audit=r.get('renderAudit') or {};formatpass=bool(lesson and not (check and check.get('presentationPending')) and audit.get('schemaValid') and not audit.get('latexErrors') and not audit.get('languageErrors'))
 lines += [f"## Question {index} — {r['id']}",'',f"**Type:** {c.get('type',c.get('group','algebra'))}",f"**Difficulty:** {c.get('difficulty','Not specified')}",f"**Source:** {c.get('source','Source not recorded')}",f"**Split:** {r['split']}",f"**Evaluation role:** {c.get('evaluationRole','historical capture')}; generated family variants are diagnostic, not held-out generalization evidence.",'','**Question statement:**','',math_text(question_lines(r['question'])),'','**LaTeX question:**','','```latex',latex_document(tex_text(question_lines(r['question']))),'```','','**Bot’s answer — actual implementation output:**','',f"Status: {solution.get('status',r.get('error','transport failure'))}; model: {solution.get('model','not recorded')}; prompt: {solution.get('promptVersion','not recorded')}; bắt đầu: {r['startedAt']}; độ trễ: {r['durationMs']:.2f} ms.",'']
 tex=[]
 if lesson:
  a=lesson['analysis'];lines += ['### Diễn giải và phương pháp','',math_text(a['statement'])]
  for field in ['subtopic','concepts','givens','unknowns','constraints','statusReason','interpretationNotes']:
   value=a.get(field)
   if value:lines += ['',f"**{field}:** "+math_text('; '.join(value) if isinstance(value,list) else value)]
  lines+=['',math_text(lesson['strategy']),'','### Gợi ý đã sinh','']
  for h in lesson['hints']:
   lines += [f"**{h['id']} (mức {h['level']}, bước {h.get('stepId','')}):** "+math_text(h['question']),'',math_text(h.get('cue') or ''),'',math_text(h['explanation'])]
   if h.get('math'):lines+=['','\\['+h['math']+'\\]']
   lines+=['']
  lines+=['### Step-by-step explanation — actual solution steps','']
  for i,s in enumerate(lesson['steps'],1):
   lines += [f"**Bước {i}:** "+math_text(s['title']),'',math_text(s['explanation'])]
   tex += [f"\\paragraph{{Bước {i}}} "+tex_text(s['title']),tex_text(s['explanation'])]
   if s.get('math'):lines += ['','\\['+s['math']+'\\]'];tex += ['\\['+s['math']+'\\]']
   if s.get('reason'):lines += ['','**Lý do:** '+math_text(s['reason'])];tex += ['Lý do: '+tex_text(s['reason'])]
   if s.get('uses'):lines += ['','**Phụ thuộc:** '+', '.join(s['uses'])]
   lines+=[''];tex+=['']
  # Preserve metadata even if it contradicts the final solution step. Never substitute a corrected answer.
  lines+=['**Metadata kết luận thực tế:** '+math_text(lesson['finalAnswer']['text'])]
  if lesson['finalAnswer'].get('math'):lines+=['','\\['+lesson['finalAnswer']['math']+'\\]']
  lines+=['','**Kiểm tra do ứng dụng trả về (không tự động coi là kiểm tra độc lập):**','','```json',json.dumps(solution.get('verification'),ensure_ascii=False,indent=2),'```','']
 else:
  lines+=['```json',json.dumps(r.get('body',{'error':r.get('error')}),ensure_ascii=False,indent=2),'```','']
  tex += [tex_text('Ứng dụng chưa trả về bài giải hoàn chỉnh. Phản hồi thực tế là lỗi có kiểm soát hoặc lỗi vận chuyển như ghi ở báo cáo.')]
 lines += ['**LaTeX solution:**','','```latex',latex_document('\n\n'.join(tex)),'```','','**Independent verification:**','',check.get('independentDerivation','') if check else 'Chưa có kiểm tra toán độc lập cho phản hồi này; không tự coi trạng thái ready là đúng toán.','',('Đáp án độc lập: '+check.get('independentAnswer','')) if check else '', '', '**Evaluation:**','',f"- Mathematical correctness: {'Pass' if mathpass else 'Fail' if check and check['mathematics']=='fail' else 'Unverified'}.",f"- Completeness: {'Pass' if completepass else 'Fail' if not lesson or check and (check['mathematics']=='fail' or check.get('completeness')=='fail') else 'Unverified'}.",f"- Explanation quality: {'Pass (proxy; human review pending)' if explainpass else 'Fail — missing deductions' if check and check.get('explanation')=='fail' else 'Unverified' if lesson else 'Fail — no full solution'}.",f"- LaTeX and formatting: {'Pass' if formatpass else 'Fail' if lesson else 'Not applicable to missing solution'}.",f"- Response latency: {r['durationMs']:.2f} ms; scope stated above.",f"- Final verdict: {('Pass on this frozen held-out question' if summary['heldOut'] else 'Pass on this development/validation question') if mathpass and completepass and explainpass and formatpass else 'Fail or unverified; does not pass quality gate'}.",'']
 if check and check.get('presentationLimits'):lines += ['**Presentation review:** '+check['presentationLimits'],'']
 if check and check.get('rubric'):lines += ['Rubric proxy: '+json.dumps(check['rubric'],ensure_ascii=False)+f"; tổng **{sum(check['rubric'].values())}/100**. Không phải điểm hài lòng do người dùng chấm.",'']
 if not (mathpass and completepass and explainpass):lines += ['**Failure analysis:**','',check.get('failureAnalysis',check.get('independentDerivation','')) if check else 'Phản hồi chưa đủ bằng chứng đạt toán học. Giữ nguyên câu trả lời và lỗi thực tế để điều tra; lỗi có kiểm soát không được tính là một bài giải đúng.','']
content='\n'.join(lines)+'\n'
blocks=re.findall(r'```latex\n([\s\S]*?)\n```',content)
compilation_file=base/'tex-validation/summary.json'
compilation=json.loads(compilation_file.read_text()).get('phases',{}).get(phase) if compilation_file.exists() else None
compiled=bool(compilation and compilation.get('blocksSha256')==hashlib.sha256('\n'.join(blocks).encode()).hexdigest() and compilation['passed']==compilation['total'])
compilation_status=f"Đã biên dịch thực tế {len(blocks)} khối đề/lời giải của báo cáo này bằng Tectonic; không có lỗi biên dịch, thiếu ký tự hoặc dòng tràn. Kết quả: [tex-validation/summary.json](../../../tools/specialist-training/iteration-03/tex-validation/summary.json)." if compiled else 'Các trường toán đã qua KaTeX; tài liệu TeX của phiên bản báo cáo này chưa có bằng chứng biên dịch đầy đủ.'
content=content.replace('TEX_COMPILATION_STATUS',compilation_status)
summary['standaloneTexCompilationPassed']=compiled
(base/(phase+'-summary.json')).write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
dest.mkdir(exist_ok=True);path=dest/(phase+'.md');path.write_text(content);print(json.dumps(summary,ensure_ascii=False));print(path)
