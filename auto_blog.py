import sys
import json
import os
import re
from datetime import datetime
import subprocess
from google import genai

# =========================================
# ASCEND AUTO BLOG ENGINE v4
# =========================================

API_KEY = "AIzaSyA2NNzqv02FzTEcED1a0D3UrtQICzIx01s"

client = genai.Client(api_key=API_KEY)

if len(sys.argv) < 3:
    print("Usage: python auto_blog.py 'Blog Topic' 'images/your-image.jpg'")
    sys.exit()

BLOG_TOPIC = sys.argv[1]
IMAGE_PATH = sys.argv[2]
DATE_DISPLAY = datetime.now().strftime("%d %b %Y")
DATE_ISO = datetime.now().strftime("%Y-%m-%d")

print(f"🧠 Generating article: {BLOG_TOPIC}")

# =========================================
# CREATE SLUG
# =========================================

slug = BLOG_TOPIC.lower()
slug = re.sub(r"[^a-z0-9\s-]", "", slug)
slug = re.sub(r"\s+", "-", slug.strip())
slug = re.sub(r"-+", "-", slug)

filename = slug + ".html"
blog_path = f"blog/{filename}"
blog_url = f"/blog/{filename}"

if os.path.exists(blog_path):
    print("⚠️  Blog already exists. Stopping to prevent duplicates.")
    sys.exit()

# =========================================
# ROBUST JSON PARSER
# =========================================

def try_parse_json(text):
    text = text.strip()
    text = re.sub(r"^```json\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"^```\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    text = text.strip()
    try:
        return json.loads(text)
    except Exception:
        pass
    match = re.search(r'\{[\s\S]*\}', text)
    if match:
        try:
            return json.loads(match.group())
        except Exception:
            pass
    return None

# =========================================
# GEMINI PROMPT
# =========================================

prompt = f"""Write a professional SEO-optimized fitness blog post about: {BLOG_TOPIC}

Return ONLY valid JSON. No markdown. No backticks. No extra text before or after.

{{
  "title": "blog title here",
  "description": "SEO meta description under 155 chars",
  "excerpt": "2-3 sentence summary for the blog card",
  "content": "<h2 id='section-1'>Section Title</h2><p>Paragraph text here.</p><h2 id='section-2'>Another Section</h2><p>More text.</p>"
}}

Requirements:
- title: compelling, SEO-focused
- description: under 155 characters
- excerpt: short teaser for the blog listing card
- content: 1200+ words using h2 tags with unique id attributes (id='section-1', id='section-2' etc.) and p tags
- Every h2 MUST have a unique id attribute like id='section-1'
- educational, data-driven tone for elite athletes
- No quotes inside attribute values in the HTML content"""

# =========================================
# GENERATE ARTICLE (3 retries)
# =========================================

data = None
for attempt in range(3):
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        data = try_parse_json(response.text)
        if data and "content" in data and "title" in data:
            print(f"✅ Article generated on attempt {attempt + 1}")
            break
        print(f"⚠️  Attempt {attempt + 1}: JSON parse failed, retrying...")
    except Exception as e:
        print(f"⚠️  Attempt {attempt + 1} error: {e}")

if not data:
    print("❌ Generation failed after 3 attempts. Exiting.")
    sys.exit()

data["title"] = BLOG_TOPIC
excerpt = data.get("excerpt", data.get("description", ""))

# =========================================
# AUTO-GENERATE TOC FROM CONTENT HEADINGS
# =========================================

def generate_toc(content):
    """Extract h2/h3 headings with ids and build TOC links."""
    headings = re.findall(r'<h[23][^>]*id=["\']([^"\']+)["\'][^>]*>(.*?)</h[23]>', content, re.IGNORECASE)
    if not headings:
        # Fallback: add ids to headings that don't have them
        counter = [0]
        def add_id(m):
            counter[0] += 1
            tag = m.group(1)
            attrs = m.group(2)
            text = m.group(3)
            if 'id=' not in attrs:
                return f'<{tag} {attrs} id="section-{counter[0]}">{text}</{tag}>'
            return m.group(0)
        content = re.sub(r'<(h[23])([^>]*)>(.*?)</h[23]>', add_id, content, flags=re.IGNORECASE)
        headings = re.findall(r'<h[23][^>]*id=["\']([^"\']+)["\'][^>]*>(.*?)</h[23]>', content, re.IGNORECASE)

    if not headings:
        return "<ul><li><a href='#top'>Overview</a></li></ul>", content

    items = []
    for hid, htext in headings:
        # Strip any inner HTML tags from heading text
        clean = re.sub(r'<[^>]+>', '', htext).strip()
        items.append(f'<li><a href="#{hid}">{clean}</a></li>')

    toc_html = "<ul>\n" + "\n".join(items) + "\n</ul>"
    return toc_html, content

toc_html, updated_content = generate_toc(data["content"])
data["content"] = updated_content

# =========================================
# CREATE BLOG PAGE FROM TEMPLATE
# =========================================

with open("template.html", "r", encoding="utf-8") as f:
    template = f.read()

final_blog = template \
    .replace("{{TITLE}}", data["title"]) \
    .replace("{{DESCRIPTION}}", data.get("description", data["title"])) \
    .replace("{{META_DESCRIPTION}}", data.get("description", data["title"])) \
    .replace("{{SLUG}}", slug) \
    .replace("{{DATE}}", DATE_DISPLAY) \
    .replace("{{IMAGE_PATH}}", IMAGE_PATH) \
    .replace("{{TOC}}", toc_html) \
    .replace("{{CONTENT}}", data["content"])

os.makedirs("blog", exist_ok=True)
with open(blog_path, "w", encoding="utf-8") as f:
    f.write(final_blog)

print(f"📄 Blog page created: {blog_path}")

# =========================================
# BLOG CARDS
# =========================================

new_card_blog = f"""<div class="glass-card flex flex-col overflow-hidden group hover:-translate-y-2 transition-transform duration-300 reveal card-1">
                <div class="relative h-[220px] w-full bg-cover bg-center border-b border-white/10" style="background-image: url('{IMAGE_PATH}');">
                    <div class="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300"></div>
                    <span class="absolute top-4 right-4 bg-[#2563eb] text-white text-[11px] font-bold px-3 py-1.5 rounded-full tracking-wider uppercase">Intelligence</span>
                    <div class="absolute -bottom-6 left-6 w-14 h-14 rounded-full border-4 border-[#0a0a0a] overflow-hidden bg-gray-800 shadow-lg z-10">
                        <img src="/public/images/Author.jpg" alt="ASCEND Author" class="w-full h-full object-cover">
                    </div>
                </div>
                <div class="p-8 pt-10 relative flex flex-col flex-grow bg-white/[0.01]">
                    <span class="text-blue-500 text-xs font-bold uppercase mb-3 block tracking-wider">{DATE_DISPLAY}</span>
                    <h3 class="text-xl font-bold text-white mb-3 leading-tight group-hover:text-[#2563eb] transition-colors duration-300">{data['title']}</h3>
                    <p class="text-white/50 text-sm mb-6 flex-grow leading-relaxed">{excerpt}</p>
                    <a href="{blog_url}" class="text-[#2563eb] font-bold text-sm uppercase tracking-wider hover:text-blue-400 inline-flex items-center gap-2 mt-auto w-max">Read Article <span class="text-lg leading-none">&raquo;</span></a>
                </div>
            </div>"""

new_card_index = f"""<article class="glass-card flex flex-col overflow-hidden group hover:-translate-y-2 transition-transform duration-300 reveal">
                <div class="relative h-56 w-full bg-cover bg-center border-b border-white/10" style="background-image: url('{IMAGE_PATH}');">
                    <div class="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300"></div>
                    <span class="absolute top-4 right-4 bg-[#2563eb] text-white text-[11px] font-bold px-4 py-1.5 rounded-full tracking-wider uppercase">BLOG</span>
                    <div class="absolute -bottom-6 left-6 w-14 h-14 rounded-full border-4 border-[#000] overflow-hidden bg-gray-800 z-10">
                        <img src="/public/images/Author.jpg" alt="Author" class="w-full h-full object-cover">
                    </div>
                </div>
                <div class="p-8 pt-10 flex flex-col flex-grow relative bg-white/[0.01]">
                    <h3 class="text-xl font-bold text-white mb-3 leading-tight group-hover:text-[#2563eb] transition-colors duration-300">{data['title']}</h3>
                    <p class="text-white/50 text-sm mb-6 flex-grow leading-relaxed">{excerpt}</p>
                    <a href="{blog_url}" class="text-[#2563eb] font-bold text-sm uppercase tracking-wider hover:text-blue-400 mt-auto w-max">READ MORE &raquo;</a>
                </div>
            </article>"""

# =========================================
# UPDATE INDEX.HTML — keep latest 3 only
# =========================================

def update_index():
    marker = "<!-- BLOG_CARDS_MARKER -->"
    try:
        with open("index.html", "r", encoding="utf-8") as f:
            html = f.read()

        if blog_url in html:
            print("⚠️  Blog already in index.html — skipping")
            return

        if marker not in html:
            print("❌ BLOG_CARDS_MARKER not found in index.html")
            return

        updated = html.replace(marker, marker + "\n" + new_card_index, 1)

        grid_pattern = re.compile(
            r'(<!-- BLOG_CARDS_MARKER -->)(.*?)(</div>\s*\n\s*</section>)',
            re.DOTALL
        )
        m = grid_pattern.search(updated)
        if m:
            cards_block = m.group(2)
            articles = re.findall(r'<article[\s\S]*?</article>', cards_block)
            articles = articles[:3]
            new_block = "\n" + "\n\n".join(articles) + "\n\n"
            updated = updated[:m.start(2)] + new_block + updated[m.end(2):]

        with open("index.html", "w", encoding="utf-8") as f:
            f.write(updated)

        print("✅ index.html updated — showing latest 3 blogs")

    except Exception as e:
        print(f"❌ index.html update failed: {e}")

update_index()

# =========================================
# UPDATE BLOG.HTML — inject at top, keep ALL cards, never remove existing
# =========================================

def update_blog():
    marker = "<!-- BLOG_CARDS_MARKER -->"
    try:
        with open("blog.html", "r", encoding="utf-8") as f:
            html = f.read()

        if blog_url in html:
            print("⚠️  Blog already in blog.html — skipping")
            return

        if marker not in html:
            print("❌ BLOG_CARDS_MARKER not found in blog.html")
            return

        # Inject new card right after marker — existing cards stay untouched below
        updated = html.replace(marker, marker + "\n" + new_card_blog + "\n", 1)

        # Renumber card-N classes so animations stay in order
        card_num = [0]
        def renumber(match):
            card_num[0] += 1
            n = ((card_num[0] - 1) % 6) + 1
            return f'card-{n}'
        updated = re.sub(r'card-\d+', renumber, updated)

        with open("blog.html", "w", encoding="utf-8") as f:
            f.write(updated)

        print("✅ blog.html updated — all cards preserved")

    except Exception as e:
        print(f"❌ blog.html update failed: {e}")

update_blog()

# =========================================
# UPDATE SITEMAP.XML
# =========================================

sitemap_full_url = f"https://www.ascendapp.in/blog/{filename}"

sitemap_entry = f"""
  <url>
    <loc>{sitemap_full_url}</loc>
    <lastmod>{DATE_ISO}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    <image:image>
      <image:loc>https://www.ascendapp.in/{IMAGE_PATH}</image:loc>
      <image:title>{data['title']}</image:title>
    </image:image>
  </url>"""

try:
    with open("sitemap.xml", "r", encoding="utf-8") as f:
        sitemap = f.read()

    if sitemap_full_url in sitemap:
        print("⚠️  Sitemap already has this blog — skipping")
    else:
        sitemap_marker = "<!-- BLOG_SITEMAP_MARKER -->"
        if sitemap_marker in sitemap:
            sitemap = sitemap.replace(sitemap_marker, sitemap_entry + "\n\n  " + sitemap_marker, 1)
        else:
            sitemap = sitemap.replace("</urlset>", sitemap_entry + "\n\n</urlset>")

        with open("sitemap.xml", "w", encoding="utf-8") as f:
            f.write(sitemap)

        print("✅ sitemap.xml updated")

except Exception as e:
    print(f"⚠️  Sitemap update failed: {e}")

# =========================================
# GIT PUSH
# =========================================

print("🚀 Pushing to GitHub...")

try:
    subprocess.run(["git", "pull", "--rebase"], check=True)
    subprocess.run(["git", "add", "."], check=True)
    subprocess.run(["git", "commit", "-m", f"Blog: {data['title']}"], check=True)
    subprocess.run(["git", "push"], check=True)
    print("🌍 Deployed via Vercel")
except Exception as e:
    print(f"⚠️  Git push failed: {e}")

print("✅ ASCEND BLOG AUTOMATION COMPLETE")
