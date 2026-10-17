# Tính độc lập kết quả kỳ vọng của bộ dữ liệu chuẩn (mục 9, docs/PRODUCT_SPEC_DASHBOARD.md v2.0).
# Chạy: python3 docs/analysis/golden_dataset_check.py — kết quả phải khớp TC-01, 02, 03, 05, 07, 11.
from datetime import date as D
# lines: (sp, qty, line_value, vat_rate)
pre=[ # don dat: id, cn, nv, created, value, lines, end(kind,date)
 ("O3","A","NV1",D(2026,9,12),[("T1",2,2160000,.08)],None),
 ("O4","B","NV3",D(2026,9,15),[("T1",1,1080000,.08)],("ket_thuc",D(2026,10,3))),
 ("O7","A","NV2",D(2026,9,25),[("T1",1,1080000,.08)],("huy",D(2026,10,5))),
 ("O9","B","NV3",D(2026,9,29),[("T1",2,2160000,.08)],None),
 ("O12","A","NV2",D(2026,10,8),[("T1",3,3240000,.08)],None)]
direct=[ # id, cn, nv, created, completed(None=cancelled), lines
 ("O1","A","NV1",D(2026,9,5),D(2026,9,5),[("G1",1,1100000,.10)]),
 ("O2","A","NV2",D(2026,9,10),D(2026,9,10),[("G2",1,1188000,.10),("PK2",1,194400,.08)]),
 ("O5","B","NV3",D(2026,10,3),D(2026,10,3),[("G3",1,1650000,.10)]),
 ("O6","B","NV3",D(2026,9,20),D(2026,9,20),[("G1",2,2200000,.10)]),
 ("O8","A","NV1",D(2026,9,28),None,[("G1",1,1100000,.10)]),
 ("O10","B","NV3",D(2026,9,30),D(2026,10,2),[("G1",1,1100000,.10)]),
 ("O11","A","NV2",D(2026,10,10),D(2026,10,10),[("PK2",5,1100000,.10)])]
returns=[("O2","A","NV2",D(2026,9,25),194400),("O6","B","NV3",D(2026,10,2),2200000)]
def calc(s,e,asof=D(2026,10,31),cn=None):
    inK=lambda d:s<=d<=e
    ok=lambda c:cn is None or c==cn
    gmv=vat=n=units=0
    for i,c,nv,cr,lines,end in pre:
        if inK(cr) and ok(c):
            gmv+=sum(l[2] for l in lines); vat+=sum(l[2]*l[3]/(1+l[3]) for l in lines); n+=1; units+=sum(l[1] for l in lines)
    for i,c,nv,cr,comp,lines in direct:
        if comp and comp<=asof and inK(cr) and ok(c):
            gmv+=sum(l[2] for l in lines); vat+=sum(l[2]*l[3]/(1+l[3]) for l in lines); n+=1; units+=sum(l[1] for l in lines)
    ra=sum(v for i,c,nv,d,v in returns if inK(d) and d<=asof and ok(c))
    rb=sum(sum(l[2] for l in lines) for i,c,nv,cr,lines,end in pre if end and end[0]=="ket_thuc" and inK(end[1]) and end[1]<=asof and ok(c))
    rc=sum(sum(l[2] for l in lines) for i,c,nv,cr,lines,end in pre if end and end[0]=="huy" and inK(end[1]) and end[1]<=asof and ok(c))
    k=sum(1 for i,c,nv,cr,lines,end in pre if end and inK(end[1]) and end[1]<=asof and ok(c))
    dtt=gmv-ra-rb-rc; vol=n-k
    return dict(GMV=gmv,VAT=round(vat),M02g=n,M05a=ra,M05b=rb,M05c=rc,DTT=dtt,M02=vol,AOV=(dtt/vol if vol>0 else None),UPT=units/n if n else None)
S,E=D(2026,9,1),D(2026,9,30); O,OE=D(2026,10,1),D(2026,10,31)
print("TC01",calc(S,E)); print("TC02",calc(O,OE))
for c in "AB": print("TC03 Sep",c,calc(S,E,cn=c)); print("TC03 Oct",c,calc(O,OE,cn=c))
print("TC05",calc(S,E,asof=D(2026,10,1)))
print("TC11",calc(S,D(2026,9,15))["GMV"])
t1,t2=calc(D(2026,8,31),E),calc(O,OE)
for m in ["GMV","DTT","M02","AOV"]: print("TC07",m,round((t2[m]-t1[m])/t1[m]*100,1))
