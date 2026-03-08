import sys
import json
import os
import re
from datetime import datetime
import subprocess
from google import genai

# --- 1. SETUP (HARDCODED & SECURE) ---
API_KEY = "AIzaSyAnIRCXX5sK8A58JTizsxwhmowMd6Y_qnE"
client = genai.Client(api_key=API_KEY)

if len(sys.argv) < 3:
    print("Usage: python auto_blog.py 'Blog Topic' 'images/your-image.jpg'")
    sys.exit()

BLOG_TOPIC = sys.argv[1]
IMAGE_PATH = sys.argv[2]

# --- 2. AI GENERATION ---
print(f"🧠 Using modern Gemini API to write: {BLOG_TOPIC}...")

prompt = f"""
Write a professional, technical blog post about: {BLOG_TOPIC}.
The target audience is elite athletes and fitness coaches using the Ascend app.
Format the output as a JSON object with exactly these keys:
"title": "placeholder",
"description": "A 2-sentence summary for the preview card",
"toc": "An HTML <ul> list of 4-5 anchor links. Each link MUST format exactly like this: <li><a href='#section-name'>Section Title</a></li>",
"content": "The full blog post in HTML. You MUST use <h3> tags with id attributes that EXACTLY MATCH the href anchor links in the toc (e.g. <h3 id='section-name'>). Use <p> tags for body text."
"""

try:
    response = client.models.generate_content(
        model="gemini-2.5-flash", 
        contents=prompt
    )
    
    json_text = response.text.replace('```json', '').replace('```', '').strip()
    data = json.loads(json_text)
except Exception as e:
    print(f"❌ Generation Failed: {e}")
    sys.exit()

# FIX 1: Override AI creativity to use your exact topic as the title
data['title'] = BLOG_TOPIC

# --- 3. CREATE BLOG PAGE ---
filename = BLOG_TOPIC.lower().replace(" ", "-").replace("?", "").replace(",", "") + ".html"
slug = filename
blog_path = f"blog/{filename}"
date_str = datetime.now().strftime('%d %b %Y')

with open("template.html", "r", encoding="utf-8") as f:
    template = f.read()

final_blog = template.replace("{{TITLE}}", data['title']) \
                     .replace("{{DESCRIPTION}}", data['description']) \
                     .replace("{{TOC}}", data['toc']) \
                     .replace("{{CONTENT}}", data['content']) \
                     .replace("{{IMAGE_PATH}}", IMAGE_PATH) \
                     .replace("{{SLUG}}", slug) \
                     .replace("{{DATE}}", date_str)

with open(blog_path, "w", encoding="utf-8") as f:
    f.write(final_blog)

# --- 4. INJECT INTO SITE ---
new_card = f"""
            <article class="glass-card flex flex-col overflow-hidden group hover:-translate-y-2 transition-transform duration-300 reveal">
                <div class="relative h-56 w-full bg-cover bg-center border-b border-white/10" style="background-image: url('{IMAGE_PATH}');">
                    <div class="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300"></div>
                    <span class="absolute top-4 right-4 bg-[#2563eb] text-white text-[11px] font-bold px-4 py-1.5 rounded-full tracking-wider uppercase">BLOG</span>
                    <div class="absolute -bottom-6 left-6 w-14 h-14 rounded-full border-4 border-[#000] overflow-hidden bg-gray-800 z-10">
                        <img src="/public/images/Author.jpg" alt="Author" class="w-full h-full object-cover">
                    </div>
                </div>
                <div class="p-8 pt-10 flex flex-col flex-grow relative bg-white/[0.01]">
                    <h3 class="text-xl font-bold text-white mb-3 leading-tight group-hover:text-[#2563eb] transition-colors duration-300">{data['title']}</h3>
                    <p class="text-white/50 text-sm mb-6 flex-grow leading-relaxed">{data['description']}</p>
                    <a href="blog/{filename}" class="text-[#2563eb] font-bold text-sm uppercase tracking-wider hover:text-blue-400 mt-auto w-max">READ MORE »</a>
                </div>
            </article>
"""

def update_blog_html():
    """Injects new card into blog.html — no limit, newest first."""
    with open("blog.html", "r", encoding="utf-8") as f:
        html = f.read()
    marker = "<!-- BLOG_CARDS_MARKER -->"
    if marker in html:
        with open("blog.html", "w", encoding="utf-8") as f:
            f.write(html.replace(marker, f"{marker}\n{new_card}", 1))
        print("✅ Updated blog.html")
    else:
        print("⚠️ Marker not found in blog.html — nothing injected")

def update_index_html():
    """Injects new card into index.html and trims to latest 3 only."""
    with open("index.html", "r", encoding="utf-8") as f:
        html = f.read()
    marker = "<!-- BLOG_CARDS_MARKER -->"
    if marker not in html:
        print("⚠️ Marker not found in index.html — nothing injected")
        return

    # Inject new card at the top
    html = html.replace(marker, f"{marker}\n{new_card}", 1)

    # Extract all article cards after the marker
    marker_pos = html.index(marker) + len(marker)
    before_marker = html[:marker_pos]
    after_marker = html[marker_pos:]

    # Find all <article ...>...</article> blocks
    articles = re.findall(r'(<article\b.*?</article>)', after_marker, re.DOTALL)

    # Keep only the 3 most recent (they're already newest-first)
    kept = articles[:3]

    # Find where articles end and the rest of the page continues
    last_article_end = 0
    for match in re.finditer(r'<article\b.*?</article>', after_marker, re.DOTALL):
        last_article_end = match.end()

    rest_of_page = after_marker[last_article_end:]

    # Rebuild
    new_after = "\n" + "\n\n".join(kept) + "\n\n" + rest_of_page.lstrip()
    html = before_marker + new_after

    with open("index.html", "w", encoding="utf-8") as f:
        f.write(html)
    print(f"✅ Updated index.html (showing latest {len(kept)} posts)")

update_index_html()
update_blog_html()

# --- 5. AUTOMATIC SITEMAP UPDATER (FIX 3) ---
sitemap_url = f"https://www.ascendapp.in/blog/{filename}"
new_sitemap_entry = f"""
    <url>
        <loc>{sitemap_url}</loc>
        <lastmod>{datetime.now().strftime('%Y-%m-%d')}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>"""

try:
    with open("sitemap.xml", "r", encoding="utf-8") as f:
        sitemap_content = f.read()
        
    marker = "<!-- BLOG_SITEMAP_MARKER -->"
    if marker in sitemap_content:
        updated_sitemap = sitemap_content.replace(marker, f"{new_sitemap_entry}\n    {marker}", 1)
    else:
        updated_sitemap = sitemap_content.replace("</urlset>", f"{new_sitemap_entry}\n</urlset>", 1)
        
    with open("sitemap.xml", "w", encoding="utf-8") as f:
        f.write(updated_sitemap)
    print("✅ Updated sitemap.xml")
except Exception as e:
    print(f"⚠️ Could not update sitemap.xml: Make sure the file exists in your main folder. Error: {e}")

# --- 6. SECURE GIT PUSH ---
print("🚀 Pushing website updates to GitHub...")
try:
    subprocess.run(["git", "add", "index.html", "blog.html", "sitemap.xml", "blog/", "images/"], check=True)
    subprocess.run(["git", "commit", "-m", f"Post: {data['title']}"], check=True)
    subprocess.run(["git", "push"], check=True)
    print("✨ Live on Ascend!")
except Exception as e:
    print(f"⚠️ Git push failed: {e}")