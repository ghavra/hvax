import re

with open('index.html', 'r') as f:
    html = f.read()

# Fix the accidental injection in the top nav
bad_nav = """<li><a href="#how">How It Works</a>
          <a href="privacy.html">Privacy Policy</a>
          <a href="terms.html">Terms of Service</a></li>"""
good_nav = """<li><a href="#how">How It Works</a></li>"""

html = html.replace(bad_nav, good_nav)

with open('index.html', 'w') as f:
    f.write(html)
