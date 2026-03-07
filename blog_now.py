import json
import sys
import re
from datetime import datetime
import os
import subprocess
from google import genai

# --- 1. SETUP ---
API_KEY = "AIzaSyBsmwSTSt-777FvhoV3naTZhxwZ6coYJGE" 
client = genai.Client(api_key=API_KEY)

if len(sys.argv) < 2:
    print("Usage: python blog_now.py 'Your blog topic here'")
    sys.exit()

topic = sys.argv[1]
today_date = datetime.now().strftime("%d %b %Y").upper()
sitemap_date = datetime.now().strftime("%Y-%m-%d")

print(f"🧠 Asking AI to write about: {topic}...")

# --- 2. CALL THE AI ---
prompt = f"""
Write a high-quality, technical SEO blog post for ASCEND (a premium workout tracker app).
Topic: {topic}. 
Return ONLY a valid JSON object. 
CRITICAL RULES TO PREVENT CRASHES:
1. Do not wrap the response in ```json markdown blocks. Output raw JSON.
2. NEVER use double quotes (") inside the content_html text. Use single quotes (') instead.

Keys required exactly as follows:
"title": The blog title.
"slug": The URL slug.
"meta_description": SEO description under 160 characters.
"card_summary": A 2-sentence summary.
"content_html": The full article in HTML tags (use ONLY <h2>, <p>, <ul>, <li>, <strong>).
"""

try:
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt
    )

    clean_json = re.sub(r"```json|```", "", response.text).strip()
    blog_data = json.loads(clean_json)

    slug = blog_data['slug']
    file_path = f"blog/{slug}.html"

    print("✅ AI finished writing! Generating files...")

    # Update template.html
    with open('template.html', 'r', encoding='utf-8') as f:
        template = f.read()

    template = template.replace('{{TITLE}}', blog_data['title'])
    template = template.replace('{{META_DESCRIPTION}}', blog_data['meta_description'])
    template = template.replace('{{DATE}}', today_date)
    template = template.replace('{{CONTENT}}', blog_data['content_html'])

    os.makedirs('blog', exist_ok=True)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(template)

    # Update index.html
    with open('index.html', 'r', encoding='utf-8') as f:
        index_html = f.read()
    
    new_card = f"""<article class="glass-card flex flex-col overflow-hidden group hover:-translate-y-2 transition-transform duration-300 reveal active">
                <div class="relative h-56 w-full bg-cover bg-center border-b border-white/10" style="background-image: url('images/cns.jpg');">
                    <div class="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300"></div>
                    <span class="absolute top-4 right-4 bg-[#2563eb] text-white text-[11px] font-bold px-4 py-1.5 rounded-full tracking-wider uppercase">NEW</span>
                </div>
                <div class="p-8 pt-10 flex flex-col flex-grow relative bg-white/[0.01]">
                    <h3 class="text-xl font-bold text-white mb-3 leading-tight group-hover:text-[#2563eb] transition-colors duration-300">{blog_data['title']}</h3>
                    <p class="text-white/50 text-sm mb-6 flex-grow leading-relaxed">{blog_data['card_summary']}</p>
                    <a href="/{file_path}" class="text-[#2563eb] font-bold text-sm uppercase tracking-wider hover:text-blue-400 mt-auto w-max">READ MORE »</a>
                </div>
            </article>"""

    index_html = index_html.replace('', new_card)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(index_html)

    # Update sitemap.xml
    with open('sitemap.xml', 'r', encoding='utf-8') as f:
        sitemap = f.read()
    
    new_sitemap_entry = f"""<url>
    <loc>[https://www.ascendapp.in/](https://www.ascendapp.in/){file_path}</loc>
    <lastmod>{sitemap_date}</lastmod>
    <priority>0.8</priority>
  </url>"""

    sitemap = sitemap.replace('', new_sitemap_entry)
    with open('sitemap.xml', 'w', encoding='utf-8') as f:
        f.write(sitemap)

    print(f"🚀 Successfully generated {file_path}")

    # GitHub Push
    print("⚙️ Pushing to GitHub...")
    subprocess.run(["git", "add", "."])
    subprocess.run(["git", "commit", "-m", f"Auto-Deploy Blog: {blog_data['title']}"])
    subprocess.run(["git", "push", "origin", "main"])

    print("🎉 All done! Your new blog is live on ascendapp.in.")

except Exception as e:
    print(f"❌ An error occurred: {e}")