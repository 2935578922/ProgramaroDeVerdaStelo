import asyncio
import aiohttp
import ssl
import os
import json

async def fetch_and_download_repos(username: str, mirror_prefix: str):
    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl.CERT_NONE
    connector = aiohttp.TCPConnector(ssl=ssl_ctx)
    headers = {}
    GITHUB_TOKEN = ""
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"

    def build_mirror_url(raw_url: str) -> str:
        return f"{mirror_prefix.rstrip('/')}/{raw_url}"

    async def get_readme(session, full_name):
        url = f"https://api.github.com/repos/{full_name}/readme"
        try:
            async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                if resp.status != 200:
                    return None, None, None
                data = await resp.json()
                raw = data["download_url"]
                fname = data["name"]
                async with session.get(raw, headers=headers, timeout=aiohttp.ClientTimeout(total=10)) as r2:
                    text = await r2.text()
                return raw, fname, text
        except Exception:
            return None, None, None

    async with aiohttp.ClientSession(connector=connector) as session:
        all_repos = []
        page = 1
        while True:
            url = f"https://api.github.com/users/{username}/repos?per_page=100&page={page}"
            async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                if resp.status != 200:
                    break
                repos = await resp.json()
                if not repos:
                    break
                all_repos.extend(repos)
                page += 1

        out_list = []
        for repo in all_repos:
            rn = repo["name"]
            desc = repo["description"] or ""
            full = repo["full_name"]
            branch = repo["default_branch"]
            zip_raw = f"{full}/archive/refs/heads/{branch}.zip"
            zip_mirror_url = build_mirror_url(zip_raw)

            raw_link, md_fname, md_text = await get_readme(session, full)
            md_mirror_url = build_mirror_url(raw_link) if raw_link else None

            raw_data_item = {
                "项目名": rn,
                "描述": desc,
                "介绍文件名": md_fname,
                "镜像下载位置": md_mirror_url,
                "仓库下载链接": zip_mirror_url,
                "详细介绍数据": md_text
            }

            front_item = {
                "title": rn,
                "text": desc,
                "author": username,
                "data": raw_data_item,
                "md": md_text
            }
            out_list.append(front_item)
        return out_list


async def main():
    # 【保留你原本的读取写法，完全不改！】
    print('读取用户集')
    with open('./ProgramaroDeVerdaStelo/wwwroot/用户集.txt','r',encoding='utf-8') as f:
        用户集=f.read().split('\n')
    #用户合法性检验
    用户集=[i.replace(' ','') for i in 用户集 if i != '']
    用户集=list(set(用户集))
    print(f'开始爬取数据：{用户集}')

    all_result = []
    for 用户 in 用户集:
        print(f'爬取数据：{用户}')
        result = await fetch_and_download_repos(
            username=用户,
            mirror_prefix="https://www.github.com/"
        )
        all_result.extend(result)
    
    # 输出到 wwwroot/buttons.json
    out_path = "../ProgramaroDeVerdaStelo/wwwroot/buttons.json"
    with open(out_path,'w',encoding='utf-8') as fw:
        json.dump(all_result, fw, ensure_ascii=False, indent=2)
    print(f"✅ 已写入前端json: {out_path}")


if __name__ == "__main__":
    asyncio.run(main())
