import { describe, it } from 'mocha';
import { expect } from 'chai';
import { ensureName, ArgumentError, isAuctionName, computeAuctionEndBlock } from '../../src';
import { nameToPunycode } from '../../src/tx/builder/helpers';

const tests = [
  {
    unicodeAsHex: 'ED8CB62E636861696E',
    punycode: 'xn--hb8b.chain',
  },
  {
    unicodeAsHex: 'E8BFA9E4B993E99CA7EC9295F0988480F0A0AEB4F0A4AB8FF0ADAAA2F0AD97992E636861696E',
    punycode: 'xn--ijqv21n7sef34cz41nd6lg9kod1p6k88i.chain',
  },
  {
    unicodeAsHex: 'F0A2929F2E636861696E',
    punycode: 'xn--et8i.chain',
  },
  {
    unicodeAsHex: 'E49582EA95BAF0A19C8DF0AA9E96F0ADB981EBB195F0AB809FF0A39B932E636861696E',
    punycode: 'xn--6moy67vslo8503abh7aun7jbrman70g.chain',
  },
  {
    unicodeAsHex:
      'F0A2808DE7A8A2E9B094F09782BBF0AEA784EC9191F0A683A3E78696EB8CA8F0ADB3B6E481A2E49686F0A483A9E5B992E891BC2E636861696E',
    punycode: 'xn--jmn31letzutrtyjotp432bpu0buj6a3k44ay9mnmowcn43dj9uszekb.chain',
  },
  {
    unicodeAsHex:
      'F09796B7E39393EA93B7F0A2ABA2F0A8B4A9F0A5BDA3F0AB9681F0979383F0A3BD99F0A4A4A0F0AB889EEBA396F0AD9DBCE5B4AE2E636861696E',
    punycode: 'xn--z6k806ify1cnvqyy8s0gb4652esh8awnsh24c1h9f5x3d6gj023j.chain',
  },
  {
    unicodeAsHex: 'E7BC87E19782E18084F097BFA3EB8691F0988F9AF0AA9AB4ECA89BEC98A92E636861696E',
    punycode: 'xn--rid350a5v8hyixbfsveiffz17abwgm422e.chain',
  },
  {
    unicodeAsHex: 'F0A6A0AAEBB282F0A18BB6E3AD8BF0A3A986EC8CAAF0ABB6AD2E636861696E',
    punycode: 'xn--bkmz887adgeoy60b0cmb3s5cmd3g.chain',
  },
  {
    unicodeAsHex:
      'F0928A8CE490AAF0A79781E8A3B4F0AC8FA3F0A7B5BDF0A18AA2F0909A89F0AB8E83ED9092F0A58EBE2E636861696E',
    punycode: 'xn--6eou47okd9bpg0bmj3aob0zxiidb49bgtoro1knwpb.chain',
  },
  {
    unicodeAsHex: 'F0ADB199E78181F0A5A69FED8CBCF0AE819A2E636861696E',
    punycode: 'xn--omxo52sg0uowjwdsge.chain',
  },
  {
    unicodeAsHex: 'E7889AF09798A6F0AA92A7F0A99086E98C8EE4A99F2E636861696E',
    punycode: 'xn--lpp818gd4vd33q4y2k03ua.chain',
  },
  {
    unicodeAsHex:
      'F0AA93ADF0928DB8F0A4ADA2F0A2A2BCF09292B5EBA6A9EA9583E4958EF0A7A6A2E4A9A4F0AD9589F0A4B2B8F0A7B2B82E636861696E',
    punycode: 'xn--jnoy3k6t8g1brt34jmtbn744fo61bescdz7nmdhz29jtn0f.chain',
  },
  {
    unicodeAsHex:
      'F0AD8AA9E88A95F0A7B0A0F0A7829AF0AA84A4E5B1B3E588B6F09D9BBEF0A889BCF096A0892E636861696E',
    punycode: 'xn--oxa1131bwogwx3bs09ruzxl83qaiul7h1e5qxf.chain',
  },
  {
    unicodeAsHex: 'EB99ABE791B2F0AE838BF0A19094F0A688ADF0A5BF9FE28492E5AF83F096AC9D2E636861696E',
    punycode: 'xn--l-cf2b124efk4dn29jc43hv43d33d8557a.chain',
  },
  {
    unicodeAsHex:
      'E9BB87F09080A1E88581E592B8E9BEABF0A7BA9AEB9D81E18D99E6B6B1E98397F09794A7F0A7A89F2E636861696E',
    punycode: 'xn--46d3854a9wpj2rd0rs9sxnbew1hfc7iwt2j25lvdila.chain',
  },
  {
    unicodeAsHex: 'F097A4BC2E636861696E',
    punycode: 'xn--tz2f.chain',
  },
  {
    unicodeAsHex: 'E69E9BE981A0F0938297F0A483A72E636861696E',
    punycode: 'xn--ftvn12gur0idw3j.chain',
  },
  {
    unicodeAsHex: 'F0A88AA5EA9693E78B96E981A4F0A3A681F092929B2E636861696E',
    punycode: 'xn--k5xm44d1qowe0jtlzmzy7c.chain',
  },
  {
    unicodeAsHex: 'F0A78AA7F0A79D83E0B88C2E636861696E',
    punycode: 'xn--d3c76742af5c.chain',
  },
  {
    unicodeAsHex: 'EC82A6E2B5A5F0AE93972E636861696E',
    punycode: 'xn--nnj7428b6xur.chain',
  },
  {
    unicodeAsHex: 'F0A6B0B7F0A5BCBDE7A58DE1A98AE49EB1E3A390F0A68291E0B0B02E636861696E',
    punycode: 'xn--rpc333e1zxkgniq2dyk70be7bp70b.chain',
  },
  {
    unicodeAsHex: 'EBB9B0E59EA1F0A8A58CE897BC2E636861696E',
    punycode: 'xn--khss29hyn9a7t61a.chain',
  },
  {
    unicodeAsHex: 'E98D9FF0A2A89BE5B497F0ABB68EF0A4B798F0A292802E636861696E',
    punycode: 'xn--imt167j7q5u7xeb73crcxj.chain',
  },
  {
    unicodeAsHex: 'E5B5BAE9A087E88DB8E886BAF0ABAC87E59999F0A2ABB02E636861696E',
    punycode: 'xn--66rt9np16a7pb359bd194cm1yg.chain',
  },
  {
    unicodeAsHex: 'E597822E636861696E',
    punycode: 'xn--v2r.chain',
  },
  {
    unicodeAsHex: 'E4A493F0A49D95F0978982F0A0B195F0AD8F84E0AAB9E1B688F0A7BDA92E636861696E',
    punycode: 'xn--1ec447goz5a0o2uz8ufh8xclbzd690g.chain',
  },
  {
    unicodeAsHex:
      'F0ACB0B7F0A89BB1F0A6B08BF0AA99AAE2BCA2E58D96F0AE9680F0ABBA9FF0A388B5F0ADB5A6F0AC8E89F0A298B2F0AEA5B5E4A3A82E636861696E',
    punycode: 'xn--vept0yeref257cjtmad15fgmvbwv0cus4bqjkeixpe1cj9vmvm.chain',
  },
  {
    unicodeAsHex:
      'E5AC9BF0AA9684F0A9BC9AF0A18C85F0A3B38FF0A5AD9BF0AB87A3F0A2A184F096AC9AF0ABBF82F0A6B3A5E59F9CE1938EED9A8DEFB88EF0AE80862E636861696E',
    punycode: 'xn--sie5445ahbczu3qwhxggt9h2c5abm8a4p7c6wubmo5h7cqapy0bqu3bef3g.chain',
  },
  {
    unicodeAsHex: 'F09F88A4F0A2849BF0A7BEA0E99E98F0ABAEB9E7A186E3B2A6F0A783972E636861696E',
    punycode: 'xn--7tm371fvpvlg0ajg52bk8gd5vvavs0i.chain',
  },
  {
    unicodeAsHex: 'F0988FB3F0A08AAE2E636861696E',
    punycode: 'xn--674f860s.chain',
  },
  {
    unicodeAsHex: 'E6898BE89E85E7B195F0AD93AFE0BA8AE3B9ABF09294BBF0A29BB4E3A1AF2E636861696E',
    punycode: 'xn--y6c465sk0dty5bkh1a79n5o4xq4zp1hrk.chain',
  },
  {
    unicodeAsHex:
      'F0AB8D8BF0A1B0B0F0A2B7ACF09886A2F09B89AEF0A296BCF0AB89B0F0A8A987EB9288F0AE888BF0A1A1AAF0A5A4A3EA9E842E636861696E',
    punycode: 'xn--w58at0wru4nx1qb0twgrze4nt9np6x5ghy0efl3d6ecr99v.chain',
  },
  {
    unicodeAsHex: 'EBA497F0AD8584E58299F097A793F0A8B7AA2E636861696E',
    punycode: 'xn--4zq706wg3ygv1ojcnoc.chain',
  },
  {
    unicodeAsHex:
      'E68B9FF0ACAFA7F0A693BCF0A5B89FF0A2ABA4E396A1F0A9A5BAE4ADB7E18D99E789BDF0AB8EB3F0A5B9BAE9BFA8F0A7AFA7F0ADA79A2E636861696E',
    punycode: 'xn--46d566of5o0mvikrhj6dc278aywvctxa298bfp3dvf3dri9cf28c1z0b.chain',
  },
  {
    unicodeAsHex: 'F0AC8791F0909B9FF0A4AB8D2E636861696E',
    punycode: 'xn--c38cm246crvwc.chain',
  },
  {
    unicodeAsHex:
      'ECAC81F0A28186E5809CEB8CBFF09D9190F0978D83F0A2A790F09082BBF0A7A2BAF0ABABAEF0AD9FBFF0A1B1A32E636861696E',
    punycode: 'xn--c-uj7am951ab4ta7r3djv5hio5jjrgc8wbm4psg1fh5yc.chain',
  },
  {
    unicodeAsHex:
      'F0A398B8F0A1A7BCF0988CA7F0AB9F94E38ABAEA8D93E8BBBBF0A69BA4F0A6A895F0AB9A902E636861696E',
    punycode: 'xn--45-rl3gl80ewz9wmevgukpbgn3ed9f950sw5c.chain',
  },
  {
    unicodeAsHex: 'E0A88AF09D90B0F09D989B2E636861696E',
    punycode: 'xn--wt-l8f.chain',
  },
  {
    unicodeAsHex:
      'F0A284B2E5B4B9F0A69CABEB9B9FECB2ACF0A0AB9DF0938098F0A79A87F0A485ACF0A28592F0A5B1852E636861696E',
    punycode: 'xn--hnt499rnxn224gyu2k781atgaz84vnr9b70wa5o1b.chain',
  },
  {
    unicodeAsHex:
      'F0AA8EA8F0A4BE96F0A2A986E38D9AE39AAFF097AEBDF0ABB49CF0AB85B8F0A3BD88E8A89A2E636861696E',
    punycode: 'xn--2-xww653sthv8q6wr3whzz4a5i1ahe2nq42at00a.chain',
  },
  {
    unicodeAsHex: 'F0A997BEE4B286F0AEA0B3F0A2AA8BF0A1A4B82E636861696E',
    punycode: 'xn--c5pz543ie4kavm5hq5wd.chain',
  },
  {
    unicodeAsHex:
      'E494A6E39884E79D92E69DBBF0A0AEA4F0A1BFBDEC89B0EAA1ABE4A5A9F0A69AB0F0A8BEB7EBB69AE8B58EF0908E9C2E636861696E',
    punycode: 'xn--pglz34bt9c0v3bjtq4e4afx3buo9ajdj8k8nb75z79sbucymhbqe.chain',
  },
  {
    unicodeAsHex:
      'F098A0ACE18B9DE49582E7A8BBE7AF8AF0938180EFA995F0ACA3A6F0A3A181F0AA988D2E636861696E',
    punycode: 'xn--l3d619wnh7a9hau0dx304cqvuernsm1r6g22sc.chain',
  },
  {
    unicodeAsHex:
      'F0ADAEA5F097BAB7F096AC93F0AA8A8AF0A1A985ED829BE58B84E99DB8F0A38E93E4B285F0A2A5A8E48688F09783B8EB83882E636861696E',
    punycode: 'xn--xunu90ab3ec93f1p0ar53b174pc4jay83a0c93a818aorzabq51ascwf.chain',
  },
  {
    unicodeAsHex:
      'F0AEA898F0A084B7F0A2978FF0A985A5E8818FE3AC8FE6ACA6E68AA0EB9993F09B899BF0A3AF93E1B09D2E636861696E',
    punycode: 'xn--80f123khe1ameh2r1avz1e9x0ti3le62wcq91bty2mgpoi.chain',
  },
  {
    unicodeAsHex: 'ED8E8BE9AC88F0A9B98BE39B812E636861696E',
    punycode: 'xn--3llx56z9o9a0q61a.chain',
  },
  {
    unicodeAsHex:
      'F0A79C95E189A4E7A396F0A7A685E8B196F0A5BCA8F0A1AC80F0A5B48DF0A791A9F0ADA4A8E484862E636861696E',
    punycode: 'xn--4zd099ux88askqzt96by2uc0cdz79cy9em2g2t12a.chain',
  },
  {
    unicodeAsHex: 'CFA5F0A384A2F0A39FB7F09B889B2E636861696E',
    punycode: 'xn--3ya2831tlwxc5yf.chain',
  },
  {
    unicodeAsHex: 'F0A2BBA8E494BCE5BAB8F09BB09EF0A1BB872E636861696E',
    punycode: 'xn--0mo256d2j1wsq0c03qa.chain',
  },
  {
    unicodeAsHex:
      'F0AEA2B3F096A7B5F0ACA2AFED8D8AF0938F96F0A0B6A0E69180F096A3A8F0A68594F0A9AEB4E597AFE7A89FF0A1B2892E636861696E',
    punycode: 'xn--53rz64a75qzq5f44yectwcysb8v15dwb2aw07lygof21ueg8ud.chain',
  },
  {
    unicodeAsHex: 'F0A485B7E78CACF0A9AB89F0AE9CA4F09099BEF0A4A5A7E5A3872E636861696E',
    punycode: 'xn--yps172dwi8hfkvlmkiar76joy1e.chain',
  },
  {
    unicodeAsHex: 'F0ADA9B42E636861696E',
    punycode: 'xn--dt6m.chain',
  },
  {
    unicodeAsHex: 'F0A6BF93E1AF84C7AEEA9286F0979BACE88CB2E199A1F0AAB0A8F0A09AB92E636861696E',
    punycode: 'xn--rka285hf2dd09j328ar29txmoh0yng0qne.chain',
  },
  {
    unicodeAsHex: 'F0A89EA82E636861696E',
    punycode: 'xn--ri9k.chain',
  },
  {
    unicodeAsHex:
      'F096A89BE8B0A8E5BE87E7989AF0AAAABCE285A8F0ADA6B0F0AD9997EB8183F09494B4F0A5899FE9A8AB2E636861696E',
    punycode: 'xn--ix-gu3dq93fsgzburgl9ah92ubonc1n9zlergnm5dkdj.chain',
  },
  {
    unicodeAsHex: 'F0ADBDBDF09F889FF0AA88BC2E636861696E',
    punycode: 'xn--efv6858jbojb.chain',
  },
  {
    unicodeAsHex: 'F0938E94F0A0959B2E636861696E',
    punycode: 'xn--cg8dg496a.chain',
  },
  {
    unicodeAsHex: 'F0AD81A6E3B9BEE382BAE9A7A7E4A091F0A6A881F0AC8BA82E636861696E',
    punycode: 'xn--0ck072beohjo9f568ztqsdwzta.chain',
  },
  {
    unicodeAsHex: 'F0A6AAB3F0AC9E9EE49F9BF0A28FBEF0A89290F0928DBB2E636861696E',
    punycode: 'xn--65o2537cu2wgwd7b690axc8f.chain',
  },
  {
    unicodeAsHex: 'F0ABA6A7E79C84ED8F8CED91BFE9B0842E636861696E',
    punycode: 'xn--40y620f8h2bquad239p.chain',
  },
  {
    unicodeAsHex:
      'F0AD99A2ED9CADEC9DB4E4AF9CF0AEA792F0A4A283F0949789F0A08986E5B9B4F0A1B38BEA9D822E636861696E',
    punycode: 'xn--h0p266bwh7c050a8oqiw5mvz9k2lqb3h4e0q4o8xpb.chain',
  },
  {
    unicodeAsHex:
      'F0A3A8A5F0ACA4ACF0A996AAE39A82F0A3BE88E7A3B7E39B90EA80A2E8B8B7F0A19198F0A2A292E1A8A9F0A3AABF2E636861696E',
    punycode: 'xn--ymf013kyga923vghwalqwir85ct27ayb7aijb171a735ww65e.chain',
  },
  {
    unicodeAsHex:
      'E69096F0ADA998ED8988F0A1AC8BE9A7B3F0A780BDE9A6A4F0AB998BF0A0B88EF0908EBB2E636861696E',
    punycode: 'xn--o2u150j0ga537rrxvc263t68sagz9mw09eyl3c.chain',
  },
  {
    unicodeAsHex: 'EBB2A8E9ADAEF0A3AB8AF09B8B99E9B193EBA5B4F09D92A9E9B184F0909BA82E636861696E',
    punycode: 'xn--n-o08d8vzbv60tr9d071n5pxm2xxi.chain',
  },
  {
    unicodeAsHex: 'E1A888F0A09CB4F0A7A5ACEC959BF0A899BBF0AEA9A6F0A6ACBBF0A3BBB72E636861696E',
    punycode: 'xn--0lf0680fi1vjqvsb3i5b01rw2uww6p.chain',
  },
  {
    unicodeAsHex: 'F09884A8F0A4B19BF0A6B2B6F0A9A8ACF0A399A32E636861696E',
    punycode: 'xn--rn4fh701ab1nws3aur1c.chain',
  },
  {
    unicodeAsHex: 'F097819EED87A1F0ABB1982E636861696E',
    punycode: 'xn--q07b3110ate2j.chain',
  },
  {
    unicodeAsHex:
      'E8B694F0A5B8B5E88892F0A6A28DE48192F0A0B289F0A6A394F0A2BBB9F0A89B94F0938586ED87B7F0A4A790EAB796ECB3A5F0A6A5A82E636861696E',
    punycode: 'xn--2ln748orhh3p6a4p6aqmg1t4p6t4o808bhdwcy45b66zap0an3d314r.chain',
  },
  {
    unicodeAsHex:
      'F0A18699F0A2B4B0F0ADAE91E597ADE993BFE9A990F0A59C87F0A581A8E9B59FF0AB91B1F0A9BFB2E2B7962E636861696E',
    punycode: 'xn--vqj359j745btpe4lel755evmjb546c3pmr65obexb4d2f.chain',
  },
  {
    unicodeAsHex: 'F097BCA9F09B8A92EC9299F098A3BBE59C8FF0A0B1B0E7A997F0AD83942E636861696E',
    punycode: 'xn--edsy43fn34cj71igjkfz4dkq0hyl3n.chain',
  },
  {
    unicodeAsHex: 'E7A2B4F09083B2F0AD8194F0A99CB7F0978E89E4AA93F0A3B5BC2E636861696E',
    punycode: 'xn--2qp873ito9fu16dv9vj2r5dgtrd.chain',
  },
  {
    unicodeAsHex: 'F0ABBDABF0988D9E2E636861696E',
    punycode: 'xn--x34f2333c.chain',
  },
  {
    unicodeAsHex: 'F0A78792F0AEABB2F0A2B4952E636861696E',
    punycode: 'xn--9k0jz31i361e.chain',
  },
  {
    unicodeAsHex:
      'F0A5948CF0A7A693F09188ABE6B48CF091B198EA9CADF09784ACF0A6A689F0A99887E5978DF0AD94B0F0A4BBA9E8BBBE2E636861696E',
    punycode: 'xn--62rv45c55xrhu2s2jv0mi83l5yzp1slaz23ck4xbtm9dxu1i.chain',
  },
  {
    unicodeAsHex:
      'E98680F0A5809CE78F9EE4AAB1EC9CA8E99895E98E85F0A38287E9B9A6F0A08ABAF0A99E9D2E636861696E',
    punycode: 'xn--xrps71hhxtf0byze92qzq3equ83a7eyc381cin2i.chain',
  },
  {
    unicodeAsHex: 'E69382F0AA96A3E8AC86E9B385F0AC8980F0918A942E636861696E',
    punycode: 'xn--l7ut56fo0l0f5imfzs149a.chain',
  },
  {
    unicodeAsHex:
      'F0A090B2ECBD86F0A693B5F0ACAC93F0A681BEF096A88FF0AB8E9CF0A590B0EC849D2E636861696E',
    punycode: 'xn--3i4bz2xpi5jt3sfru9c7opuehmm4ouevb.chain',
  },
  {
    unicodeAsHex: 'E284B1F0A9A6B3F0A2B5A3F0A888B7E4B0962E636861696E',
    punycode: 'xn--f-0u5ao515m35kc2sya.chain',
  },
  {
    unicodeAsHex: 'F0AAAA83E8BCA0F0A98C83F0989EA7F0938DB82E636861696E',
    punycode: 'xn--h23a8943ah16bfrtmntya.chain',
  },
  {
    unicodeAsHex:
      'E5B2B6E38B99E68E9BF0A28B8AF0A1B7A2E9AA8BE782ABE4B1B2F0A1BFA9F0AAB2B4F0A5A69CF09288A9E68BAF2E636861696E',
    punycode: 'xn--tck284f4ele1fsyaj78c850evzwmppornierpj261p9zsj.chain',
  },
  {
    unicodeAsHex:
      'F0AA94B5E3A5B1F0A8938DF0A58599F0A98397E9A0A4F0909D84F0A7B283E18980F0ADAC83E6AFBDEA82AA2E636861696E',
    punycode: 'xn--3yd971rgu7az5yb15ixh9mf4wu1fkctupvm2au20c06wi.chain',
  },
  {
    unicodeAsHex: 'F0ADAABDF0AFA082F0A0A6A9F0ACAD9AF0A6BBB52E636861696E',
    punycode: 'xn--ziq9329h0r9bgixdwcqa.chain',
  },
  {
    unicodeAsHex: 'F09B829EEB89882E636861696E',
    punycode: 'xn--mf1bz639b.chain',
  },
];

describe('AENS utils', () => {
  describe('nameToPunycode', () => {
    it('encodes', () => {
      tests.forEach(({ unicodeAsHex, punycode }) => {
        const name = Buffer.from(unicodeAsHex, 'hex').toString();
        expect(nameToPunycode(name)).to.equal(punycode);
      });
    });
  });

  describe('ensureName', () => {
    it('fails if more than 2 labels', () => {
      expect(() => ensureName('test.test.chain')).to.throw(
        ArgumentError,
        'aens name should be including only one dot, got test.test.chain instead',
      );
    });

    it('fails if wrong top level label', () => {
      expect(() => ensureName('test.test')).to.throw(
        ArgumentError,
        'aens name should be suffixed with .chain, got test.test instead',
      );
    });

    it('fails if invalid char in label', () => {
      expect(() => ensureName('te/st.chain')).to.throw(
        ArgumentError,
        'aens name should be valid, got te/st.chain instead',
      );
      expect(() => ensureName('te%st.chain')).to.throw(
        ArgumentError,
        'aens name should be valid, got te%st.chain instead',
      );
      expect(() => ensureName('te!st.chain')).to.throw(
        ArgumentError,
        'aens name should be without illegal chars, got te!st.chain instead',
      );
    });

    it('fails if emoji char in label', () => {
      expect(() => ensureName('🚀.chain')).to.throw(
        ArgumentError,
        'aens name should be not containing emoji, got 🚀.chain instead',
      );
    });

    it('fails if name too long', () => {
      expect(() =>
        ensureName('ldiDxa1Yxy1iiTRztYEN4F8nrnfZib3Q1MllPghmst8fjJ1sI3DXzOoAddE2ETxp.chain'),
      ).to.throw(
        ArgumentError,
        'aens name should be not too long, got ldiDxa1Yxy1iiTRztYEN4F8nrnfZib3Q1MllPghmst8fjJ1sI3DXzOoAddE2ETxp.chain instead',
      );
    });

    it('fails if name starts or ends with minus', () => {
      expect(() => ensureName('-test.chain')).to.throw(
        ArgumentError,
        'aens name should be starting with no "-" char, got -test.chain instead',
      );
      expect(() => ensureName('test-.chain')).to.throw(
        ArgumentError,
        'aens name should be ending with no "-" char, got test-.chain instead',
      );
    });

    it('fails if name has minus at 2, 3 chars', () => {
      expect(() => ensureName('te--st.chain')).to.throw(
        ArgumentError,
        'aens name should be without "-" char in both the third and fourth positions, got te--st.chain instead',
      );
    });
  });

  describe('isAuctionName', () => {
    it('checks non-auction name', () => {
      expect(isAuctionName('1234567890123.chain')).to.equal(false);
    });

    it('checks auction name', () => {
      expect(isAuctionName('123456789012.chain')).to.equal(true);
    });

    it('checks non-auction unicode name', () => {
      expect(isAuctionName('æ23456.chain')).to.equal(false);
    });

    it('checks auction unicode name', () => {
      expect(isAuctionName('æ2345.chain')).to.equal(true);
    });
  });

  describe('computeAuctionEndBlock', () => {
    it('computes for longest auction', () => {
      expect(computeAuctionEndBlock('123456789012.chain', 1)).to.equal(481);
    });

    it('computes for shortest auction', () => {
      expect(computeAuctionEndBlock('1.chain', 1)).to.equal(2401);
    });

    it('computes for longest unicode auction', () => {
      expect(computeAuctionEndBlock('æ2345.chain', 1)).to.equal(481);
    });

    it('computes for shortest unicode auction', () => {
      expect(computeAuctionEndBlock('æ.chain', 1)).to.equal(961);
    });
  });
});
